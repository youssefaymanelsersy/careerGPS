import { db } from "@/db";
import { userStreaks } from "../db/schema";
import { calendarEvents } from "../../calendar/db/schema";
import { eq, and, gt, lt, asc, sql } from "drizzle-orm";
import { dispatchNotification } from "../../notifications/services/notifications.service";

export async function settleStreak(userId: string, upToDateStr: string, increment: boolean = false) {
    const upToDate = new Date(upToDateStr);
    
    // Collect notifications to dispatch outside the transaction
    const notificationsToDispatch: { type: any, channels: any[], payload: any }[] = [];

    const result = await db.transaction(async (tx) => {
        // SELECT ... FOR UPDATE
        let streakRecord = (await tx.execute(
            sql`SELECT * FROM ${userStreaks} WHERE user_id = ${userId} FOR UPDATE`
        )).rows[0] as any;
        
        if (!streakRecord) {
            await tx.insert(userStreaks).values({ userId });
            streakRecord = (await tx.execute(
                sql`SELECT * FROM ${userStreaks} WHERE user_id = ${userId} FOR UPDATE`
            )).rows[0] as any;
        }

        let {
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_resolved_date: lastResolvedDateStr,
            last_activity_date: lastActivityDateStr,
            freezes_available: freezesAvailable,
            freezes_used_this_month: freezesUsedThisMonth,
            freeze_month_anchor: freezeMonthAnchorStr,
        } = streakRecord;

        const lastResolvedDate = lastResolvedDateStr ? new Date(lastResolvedDateStr) : null;
        let lastActivityDate = lastActivityDateStr ? new Date(lastActivityDateStr) : null;
        let freezeMonthAnchor = freezeMonthAnchorStr ? new Date(freezeMonthAnchorStr) : null;

        // Refill freezes on new month and update anchor
        if (!freezeMonthAnchor || upToDate.getUTCMonth() !== freezeMonthAnchor.getUTCMonth() || upToDate.getUTCFullYear() !== freezeMonthAnchor.getUTCFullYear()) {
            freezesAvailable = 3;
            freezesUsedThisMonth = 0;
            freezeMonthAnchor = upToDate; // Fix: Update anchor to current month
        }

        if (lastResolvedDate) {
            const lastResolvedDateIso = lastResolvedDate.toISOString().split("T")[0]!;
            const upToDateIso = upToDate.toISOString().split("T")[0]!;
            
            const missedSessions = await tx.select({ date: calendarEvents.date, status: calendarEvents.status })
                .from(calendarEvents)
                .where(
                    and(
                        eq(calendarEvents.userId, userId),
                        gt(calendarEvents.date, lastResolvedDateIso),
                        lt(calendarEvents.date, upToDateIso) // Only check strictly in the past
                    )
                )
                .orderBy(asc(calendarEvents.date));

            // Group by day to see if they completed anything that day
            const statusByDay = new Map<string, boolean>();
            for (const s of missedSessions) {
                if (!statusByDay.has(s.date)) statusByDay.set(s.date, false);
                if (s.status === "completed") statusByDay.set(s.date, true);
            }

            // A missed day is a day where there was at least one scheduled/skipped session, but NO completed sessions
            const missedDays = Array.from(statusByDay.entries())
                .filter(([_, hasCompleted]) => !hasCompleted)
                .map(([day]) => day)
                .sort();

            for (const day of missedDays) {
                if (freezesAvailable > 0) {
                    freezesAvailable -= 1;
                    freezesUsedThisMonth += 1;
                    notificationsToDispatch.push({
                        type: "streak_frozen",
                        channels: ["in_app"],
                        payload: { day }
                    });
                } else {
                    currentStreak = 0;
                    notificationsToDispatch.push({
                        type: "streak_broken",
                        channels: ["in_app"],
                        payload: { day }
                    });
                }
            }
        }

        if (increment) {
            // Only increment if we haven't already had activity for this date
            const lastActivityNormalized = lastActivityDate 
                ? lastActivityDate.toISOString().split("T")[0] 
                : null;
                
            if (!lastActivityNormalized || upToDateStr !== lastActivityNormalized) {
                currentStreak += 1;
                lastActivityDate = upToDate; // Update last activity date to today
                longestStreak = Math.max(longestStreak, currentStreak);
                
                const milestones = [3, 7, 14, 30, 60, 100];
                if (milestones.includes(currentStreak)) {
                    notificationsToDispatch.push({
                        type: "streak_milestone",
                        channels: ["in_app", "push"],
                        payload: { streak: currentStreak }
                    });
                }
            }
        }

        const newResolvedDate = upToDateStr;
        const newAnchor = freezeMonthAnchor.toISOString().split("T")[0];
        const newActivityDate = lastActivityDate ? lastActivityDate.toISOString().split("T")[0] : null;

        await tx.update(userStreaks).set({
            currentStreak,
            longestStreak,
            lastResolvedDate: newResolvedDate,
            lastActivityDate: newActivityDate,
            freezesAvailable,
            freezesUsedThisMonth,
            freezeMonthAnchor: newAnchor
        }).where(eq(userStreaks.userId, userId));

        return { currentStreak, longestStreak, freezesAvailable };
    });

    // Dispatch notifications OUTSIDE the transaction lock
    for (const notif of notificationsToDispatch) {
        await dispatchNotification({
            userId,
            ...notif
        }).catch(console.error); // Catch errors so one failure doesn't stop others
    }

    return result;
}
