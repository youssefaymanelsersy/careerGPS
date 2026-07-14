import { Cron } from "croner";
import { db } from "@/db";
import { missedSessionAlerts } from "../../notifications/db/schema";
import { sql } from "drizzle-orm";
import { dispatchNotification } from "../services/notifications.service";

// Every hour or appropriate interval
export async function runMissedSessionSweep() {
    try {
        const overdueSessions = await db.execute(sql`
            SELECT ce.*, r.title as roadmap_title
            FROM calendar_events ce
            LEFT JOIN missed_session_alerts msa ON msa.event_id = ce.id
            LEFT JOIN roadmap_nodes rn ON rn.id = ce.roadmap_node_id
            LEFT JOIN roadmaps r ON r.id = rn.roadmap_id
            WHERE ce.status = 'scheduled'
              AND msa.event_id IS NULL
              AND (
                  ce.date < CURRENT_DATE
                  OR (ce.date = CURRENT_DATE AND ce.end_time < CURRENT_TIME)
              )
        `);

        const sessions = overdueSessions.rows as any[];

        // Group by user
        const byUser = sessions.reduce((acc, curr) => {
            if (!acc[curr.user_id]) acc[curr.user_id] = [];
            acc[curr.user_id].push(curr);
            return acc;
        }, {} as Record<string, typeof sessions>);

        const dispatchPromises = Object.entries(byUser).map(async ([userId, userSessions]) => {
            const sessionsArray = userSessions as any[];
            const uniqueTitles = Array.from(new Set(sessionsArray.map(s => s.roadmap_title).filter(Boolean)));
            
            // Dispatch the actual batched notification
            await dispatchNotification({
                userId,
                type: "session_missed",
                channels: ["in_app", "email", "push"],
                payload: { 
                    missedCount: sessionsArray.length,
                    roadmapTitles: uniqueTitles.length > 0 ? uniqueTitles : undefined
                }
            });

            // Mark these specific sessions as notified to prevent double-sends in dedicated table
            const trackPromises = sessionsArray.map((session: any) => 
                db.insert(missedSessionAlerts).values({
                    userId,
                    eventId: session.id,
                    alertedAt: new Date()
                }).onConflictDoNothing()
            );
            await Promise.all(trackPromises);
        });

        await Promise.all(dispatchPromises);

    } catch (error) {
        console.error("Failed to run missed session cron", error);
    }
}

export const missedSessionCron = new Cron("0 * * * *", runMissedSessionSweep);
