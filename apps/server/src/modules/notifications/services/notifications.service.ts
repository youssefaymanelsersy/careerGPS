import { db } from "@/db";
import { notifications, notificationPreferences, pushSubscriptions } from "../db/schema";
import { user } from "../../user/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { notificationTypeEnum, notificationCategoryEnum } from "../db/schema";
import webpush from "web-push";
import { Resend } from "resend";
import { NotificationEmail, getNotificationSubject } from "@careergps/emails";

import { env } from "@careergps/env/server";

const resend = new Resend(env.RESEND_API_KEY);

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        "mailto:notifications@careergps.space",
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
    );
}

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

const categoryMap: Record<NotificationType, (typeof notificationCategoryEnum.enumValues)[number]> = {
    session_reminder: "reminders",
    session_missed: "reminders",
    schedule_empty: "reminders",
    streak_at_risk: "reminders",
    streak_milestone: "streaks",
    streak_broken: "streaks",
    streak_frozen: "streaks",
    milestone_node_complete: "milestones",
};

export async function dispatchNotification({
    userId,
    type,
    payload,
    relatedEntityType,
    relatedEntityId,
    channels = ["in_app"],
}: {
    userId: string;
    type: NotificationType;
    payload?: any;
    relatedEntityType?: string;
    relatedEntityId?: string;
    channels?: ("in_app" | "push" | "email")[];
}) {
    const category = categoryMap[type];

    const [userRecord, prefs] = await Promise.all([
        db.query.user.findFirst({ where: eq(user.id, userId) }),
        db.query.notificationPreferences.findFirst({
            where: and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.category, category))
        })
    ]);

    if (!userRecord) return;

    const tz = userRecord.timezone || "UTC";
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" });
    const currentHour = parseInt(formatter.format(new Date()), 10);
    
    const quietStart = prefs?.quietHoursStart ? parseInt(prefs.quietHoursStart.split(":")[0]!) : 22;
    const quietEnd = prefs?.quietHoursEnd ? parseInt(prefs.quietHoursEnd.split(":")[0]!) : 8;

    let isQuietHour = false;
    if (quietStart > quietEnd) {
        isQuietHour = currentHour >= quietStart || currentHour < quietEnd;
    } else {
        isQuietHour = currentHour >= quietStart && currentHour < quietEnd;
    }

    // Quiet hours suppress push and email, but in-app is always created if requested
    const activeChannels = channels.filter(c => {
        if (c === "in_app") return true;
        return !isQuietHour;
    });

    const insertPromises: Promise<any>[] = [];
    const now = new Date();

    if (activeChannels.includes("in_app") && (prefs?.channelInApp ?? true)) {
        insertPromises.push(
            db.insert(notifications).values({
                userId, type, channel: "in_app", status: "pending",
                payload, relatedEntityType, relatedEntityId,
            })
        );
    }

    if (activeChannels.includes("push") && (prefs?.channelPush ?? true)) {
        const lastSeen = userRecord.lastSeenAt ? new Date(userRecord.lastSeenAt) : new Date(0);
        const presenceSuppressed = (now.getTime() - lastSeen.getTime()) < 2 * 60 * 1000;
        
        let freqCapped = false;
        if (type !== "session_reminder") {
            const todayStr = now.toISOString().split("T")[0] + "T00:00:00.000Z";
            const pushesToday = await db.select({ count: sql<number>`cast(count(*) as integer)` })
                .from(notifications)
                .where(
                    and(
                        eq(notifications.userId, userId),
                        eq(notifications.channel, "push"),
                        gte(notifications.createdAt, new Date(todayStr))
                    )
                );
            if (pushesToday[0] && pushesToday[0].count >= 2) {
                freqCapped = true;
            }
        }

        if (!presenceSuppressed && !freqCapped) {
            const [inserted] = await db.insert(notifications).values({
                userId, type, channel: "push", status: "sent",
                payload, relatedEntityType, relatedEntityId, sentAt: now
            }).returning();

            if (inserted) {
                // Fan out to all subscriptions
                const subs = await db.query.pushSubscriptions.findMany({
                    where: eq(pushSubscriptions.userId, userId)
                });
                const pushPayload = JSON.stringify({ title: "CareerGPS Notification", type, payload });
                subs.forEach(sub => {
                    webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        pushPayload
                    ).catch(console.error);
                });
            }
        }
    }
    
    if (activeChannels.includes("email") && (prefs?.channelEmail ?? true)) {
        const [inserted] = await db.insert(notifications).values({
            userId, type, channel: "email", status: "sent",
            payload, relatedEntityType, relatedEntityId, sentAt: now
        }).returning();

        if (inserted && userRecord.email) {
            const subject = getNotificationSubject(type, payload);
            resend.emails.send({
                from: "CareerGPS <notifications@updates.careergps.space>",
                to: [userRecord.email],
                subject,
                react: NotificationEmail({ type, payload })
            }).catch(console.error);
        }
    }

    await Promise.all(insertPromises);
}
