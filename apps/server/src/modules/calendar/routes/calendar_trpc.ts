import { router, protectedProcedure } from "@/trpc/index";
import { TRPCError } from "@trpc/server";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";
import { generateCalendar } from "../services/generator";
import { db } from "@/db";
import { calendarEvents, calendarEventStatusEnum } from "../db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { skillCurriculumNodes } from "@/modules/skills/db/curriculum_schema";
import { roadmapNodes } from "@/modules/roadmap/db/schema";
import { completeRoadmapNode } from "@/modules/roadmap/service";
import { settleStreak } from "@/modules/streaks/services/streak.service";
import { dispatchNotification } from "@/modules/notifications/services/notifications.service";
import { user } from "@/modules/user/db/schema";

import { notifications } from "@/modules/notifications/db/schema";
import { fromZonedTime } from "date-fns-tz";

// helper to compute reminderAt
async function computeReminderAt(userId: string, date: string, startTime: string, endTime: string): Promise<Date | null> {
    const userRecord = await db.query.user.findFirst({ where: eq(user.id, userId) });
    if (!userRecord || !userRecord.timezone) return null;

    // Parse date + startTime in user's timezone to UTC Date object
    const startDt = fromZonedTime(`${date}T${startTime}`, userRecord.timezone);
    const endDt = fromZonedTime(`${date}T${endTime}`, userRecord.timezone);

    const durationMinutes = (endDt.getTime() - startDt.getTime()) / 60000;
    
    // cap at min(15, sessionDurationMinutes)
    const leadMinutes = Math.min(15, Math.max(0, durationMinutes));

    startDt.setMinutes(startDt.getMinutes() - leadMinutes);
    return startDt;
}

async function fireScheduleEmptyIfNeeded(userId: string, needsNewSchedule: boolean) {
    if (!needsNewSchedule) return;
    
    const lastNotif = await db.query.notifications.findFirst({
        where: and(
            eq(notifications.userId, userId),
            eq(notifications.type, "schedule_empty"),
            gte(notifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
    });

    if (!lastNotif) {
        await dispatchNotification({
            userId,
            type: "schedule_empty",
            channels: ["in_app", "email"]
        });
    }
}

export const calendarRouter = router({
    getSyncToken: protectedProcedure.query(async ({ ctx }) => {
        const userRecord = await db.query.user.findFirst({
            where: eq(user.id, ctx.session.user.id),
            columns: { calendarSyncToken: true }
        });
        
        if (!userRecord || !userRecord.calendarSyncToken) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Sync token not found" });
        }

        return {
            token: userRecord.calendarSyncToken,
            // Assuming env.SERVER_URL is available, otherwise we just return the token
        };
    }),

    generate: protectedProcedure.mutation(async ({ ctx }) => {
        const events = await generateCalendar(ctx.session.user.id);
        
        for (const ev of events) {
            const reminderAt = await computeReminderAt(ctx.session.user.id, ev.event.date, ev.event.startTime, ev.event.endTime);
            if (reminderAt) {
                await db.update(calendarEvents)
                    .set({ reminderAt })
                    .where(eq(calendarEvents.id, ev.event.id));
            }
        }

        return { 
            success: true,
            count: events.length,
            events: events
        };
    }),

    getCalendar: protectedProcedure
        .input(z.object({
            view: z.enum(["month", "week"]).optional(),
            from: z.string().optional(),
            to: z.string().optional(),
        }).optional().default({}))
        .query(async ({ ctx, input }) => {
            const userData = await db.query.user.findFirst({
                where: eq(user.id, ctx.session.user.id),
                columns: { availableHoursPerDay: true, timezone: true }
            });
            const timeZone = userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const today = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
            // Build where clause
            const conditions = [eq(calendarEvents.userId, ctx.session.user.id)];
            if (input.from) {
                const fromStr: string = input.from;
                conditions.push(gte(calendarEvents.date, fromStr));
            }
            if (input.to) {
                const toStr: string = input.to;
                conditions.push(lte(calendarEvents.date, toStr));
            }

            const events = await db
                .select({
                    event: calendarEvents,
                    nodeTitle: skillCurriculumNodes.title,
                    nodeDescription: skillCurriculumNodes.description,
                })
                .from(calendarEvents)
                .innerJoin(roadmapNodes, eq(calendarEvents.roadmapNodeId, roadmapNodes.id))
                .innerJoin(skillCurriculumNodes, eq(roadmapNodes.curriculumNodeId, skillCurriculumNodes.id))
                .where(and(...conditions))
                .orderBy(asc(calendarEvents.date), asc(calendarEvents.startTime));

            // Check if needs new schedule
            const futureScheduledEvents = await db.query.calendarEvents.findFirst({
                where: and(
                    eq(calendarEvents.userId, ctx.session.user.id),
                    eq(calendarEvents.status, "scheduled"),
                    gte(calendarEvents.date, today)
                )
            });

            const needsNewSchedule = !futureScheduledEvents;

            await settleStreak(ctx.session.user.id, today, false);
            await fireScheduleEmptyIfNeeded(ctx.session.user.id, needsNewSchedule);

            const availableHoursPerDay = userData?.availableHoursPerDay ?? 2;

            return {
                events,
                needsNewSchedule,
                availableHoursPerDay
            };
        }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
        const userData = await db.query.user.findFirst({
            where: eq(user.id, ctx.session.user.id),
            columns: { availableHoursPerDay: true, timezone: true }
        });
        const timeZone = userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const today = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

        const events = await db
            .select({
                event: calendarEvents,
                nodeTitle: skillCurriculumNodes.title,
                nodeDescription: skillCurriculumNodes.description,
            })
            .from(calendarEvents)
            .innerJoin(roadmapNodes, eq(calendarEvents.roadmapNodeId, roadmapNodes.id))
            .innerJoin(skillCurriculumNodes, eq(roadmapNodes.curriculumNodeId, skillCurriculumNodes.id))
            .where(and(
                eq(calendarEvents.userId, ctx.session.user.id),
                eq(calendarEvents.date, today)
            ))
            .orderBy(asc(calendarEvents.startTime));

        const futureScheduledEvents = await db.query.calendarEvents.findFirst({
            where: and(
                eq(calendarEvents.userId, ctx.session.user.id),
                eq(calendarEvents.status, "scheduled"),
                gte(calendarEvents.date, today)
            )
        });

        const needsNewSchedule = !futureScheduledEvents;

        await settleStreak(ctx.session.user.id, today, false);
        await fireScheduleEmptyIfNeeded(ctx.session.user.id, needsNewSchedule);

        const availableHoursPerDay = userData?.availableHoursPerDay ?? 2;

        return {
            events,
            needsNewSchedule,
            availableHoursPerDay
        };
    }),

    updateEvent: protectedProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            date: z.string().optional(),
            startTime: z.string().optional(),
            endTime: z.string().optional(),
            status: z.enum(calendarEventStatusEnum.enumValues).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { eventId, ...updates } = input;
            
            // Check ownership
            const event = await db.query.calendarEvents.findFirst({
                where: and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, ctx.session.user.id))
            });

            if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found or unauthorized" });

            if (event.status === "completed" && (updates.date || updates.startTime || updates.endTime)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot move a completed task." });
            }

            if (updates.date || updates.status === "completed") {
                const userData = await db.query.user.findFirst({
                    where: eq(user.id, ctx.session.user.id),
                    columns: { timezone: true }
                });
                const timeZone = userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                const today = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

                if (updates.date && updates.date < today) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot schedule a task in the past." });
                }

                if (updates.status === "completed" && event.date > today) {
                    (updates as any).date = today;
                }
            }

            if (updates.date || updates.startTime || updates.endTime) {
                const newDate = updates.date ?? event.date;
                const newStartTime = updates.startTime ?? event.startTime;
                const newEndTime = updates.endTime ?? event.endTime;
                (updates as any).reminderAt = (await computeReminderAt(ctx.session.user.id, newDate, newStartTime, newEndTime)) as any;
                (updates as any).reminderSentAt = null;
            }

            await db.update(calendarEvents)
                .set(updates)
                .where(eq(calendarEvents.id, eventId));

            if (updates.status === "completed" || updates.status === "skipped") {
                if (updates.status === "completed") {
                    await db.update(calendarEvents)
                        .set({ status: "skipped" })
                        .where(
                            and(
                                eq(calendarEvents.roadmapNodeId, event.roadmapNodeId),
                                eq(calendarEvents.userId, ctx.session.user.id),
                                eq(calendarEvents.status, "scheduled"),
                                lte(calendarEvents.sessionIndex, event.sessionIndex - 1)
                            )
                        );
                }

                const nodeEvents = await db.query.calendarEvents.findMany({
                    where: and(
                        eq(calendarEvents.roadmapNodeId, event.roadmapNodeId),
                        eq(calendarEvents.userId, ctx.session.user.id)
                    )
                });
                
                const allDone = nodeEvents.length >= event.totalSessionsForNode && nodeEvents.every(e => 
                    e.status === "completed" || e.status === "skipped"
                );

                if (allDone) {
                    try {
                        await completeRoadmapNode({
                            userId: ctx.session.user.id,
                            nodeId: event.roadmapNodeId,
                        });
                    } catch (e) {
                        console.error("Failed to automatically complete roadmap node", e);
                    }
                } else if (updates.status === "completed") {
                    await db.update(roadmapNodes)
                        .set({ status: "inProgress" })
                        .where(
                            and(
                                eq(roadmapNodes.id, event.roadmapNodeId),
                                eq(roadmapNodes.status, "pending")
                            )
                        );
                }

                if (updates.status === "completed") {
                    const todayStr = new Date().toISOString().split("T")[0]!;
                    await settleStreak(ctx.session.user.id, todayStr, true);
                }
            }

            return { success: true };
        }),

    deleteEvent: protectedProcedure
        .input(z.object({ eventId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await db.delete(calendarEvents)
                .where(and(eq(calendarEvents.id, input.eventId), eq(calendarEvents.userId, ctx.session.user.id)));
            return { success: true };
        }),
});
