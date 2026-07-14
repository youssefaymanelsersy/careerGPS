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
            freezes_available: freezesAvailable,
            freezes_used_this_month: freezesUsedThisMonth,
            freeze_month_anchor: freezeMonthAnchorStr,
        } = streakRecord;

        const lastResolvedDate = lastResolvedDateStr ? new Date(lastResolvedDateStr) : null;
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
            
            const missedSessions = await tx.select({ date: calendarEvents.date })
                .from(calendarEvents)
                .where(
                    and(
                        eq(calendarEvents.userId, userId),
                        eq(calendarEvents.status, "scheduled"),
                        gt(calendarEvents.date, lastResolvedDateIso),
                        lt(calendarEvents.date, upToDateIso) // Only check strictly in the past
                    )
                )
                .orderBy(asc(calendarEvents.date));

            // Distinct missed days
            const missedDays = Array.from(new Set(missedSessions.map(s => s.date)));

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
            // Only increment if we haven't already resolved for this date
            const lastResolvedNormalized = lastResolvedDate 
                ? lastResolvedDate.toISOString().split("T")[0] 
                : null;
                
            if (!lastResolvedNormalized || upToDateStr !== lastResolvedNormalized) {
                currentStreak += 1;
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

        await tx.update(userStreaks).set({
            currentStreak,
            longestStreak,
            lastResolvedDate: newResolvedDate,
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
