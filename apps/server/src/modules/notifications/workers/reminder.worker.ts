import { Cron } from "croner"; // Or just use Bun.Cron if it was standard, we'll use croner or a timer for generic bun support
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { dispatchNotification } from "../services/notifications.service";

// 5-minute sweep
export async function runReminderSweep() {
    try {
        // Atomic claim
        const result = await db.execute(sql`
            UPDATE calendar_events
            SET reminder_sent_at = now()
            WHERE id IN (
                SELECT id FROM calendar_events
                WHERE status = 'scheduled'
                AND reminder_sent_at IS NULL
                AND reminder_at <= now()
                AND reminder_at > now() - interval '10 minutes'
                ORDER BY reminder_at
                LIMIT 200
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id, user_id, roadmap_node_id, date, start_time;
        `);

        const events = result.rows;
        
        const dispatchPromises = events.map((event: any) => 
            dispatchNotification({
                userId: event.user_id,
                type: "session_reminder",
                channels: ["in_app", "push"],
                relatedEntityType: "calendar_event",
                relatedEntityId: event.id,
                payload: {
                    date: event.date,
                    startTime: event.start_time
                }
            })
        );

        await Promise.all(dispatchPromises);

        // Streak at risk check: scheduled session today, freezes = 0, no notification sent yet
        const riskResult = await db.execute(sql`
            SELECT ce.id, ce.user_id, ce.date
            FROM calendar_events ce
            INNER JOIN user_streaks us ON us.user_id = ce.user_id
            LEFT JOIN notifications n 
              ON n.related_entity_id = ce.id::text 
              AND n.type = 'streak_at_risk'
            WHERE ce.status = 'scheduled'
              AND ce.date = CURRENT_DATE
              AND us.freezes_available = 0
              AND n.id IS NULL
              AND CURRENT_TIME >= ce.end_time - interval '30 minutes'
        `);

        const riskEvents = riskResult.rows;

        const riskPromises = riskEvents.map(async (event: any) => {
            await dispatchNotification({
                userId: event.user_id,
                type: "streak_at_risk",
                channels: ["in_app", "push"],
                relatedEntityType: "calendar_event",
                relatedEntityId: event.id,
                payload: { date: event.date }
            });
        });

        await Promise.all(riskPromises);
    } catch (error) {
        console.error("Failed to run reminder cron sweep", error);
    }
}

export const reminderCron = new Cron("*/5 * * * *", runReminderSweep);
