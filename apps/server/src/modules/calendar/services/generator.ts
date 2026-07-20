import { db } from "@/db";
import { user } from "../../user/db/schema";
import { roadmapNodes, roadmaps } from "../../roadmap/db/schema";
import { skillCurriculumNodes } from "../../skills/db/curriculum_schema";
import { calendarEvents } from "../db/schema";
import { eq, and, asc, inArray, gte } from "drizzle-orm";
import { format, parse, add } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const DEFAULT_START_TIME = "18:00:00";

const WEEKDAY_MAP: Record<number, number[]> = {
    1: [3], // Wed
    2: [2, 4], // Tue, Thu
    3: [1, 3, 5], // Mon, Wed, Fri
    4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    5: [1, 2, 3, 4, 5], // Mon-Fri
    6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6], // Sun-Sat (0 is Sunday in JS Date)
};

function addHoursToTime(timeStr: string, hoursToAdd: number): string {
    const parsedTime = parse(timeStr, "HH:mm:ss", new Date(0));
    const newTime = add(parsedTime, { minutes: Math.round(hoursToAdd * 60) });
    return format(newTime, "HH:mm:ss");
}

export async function generateCalendar(userId: string) {
    const userData = await db.query.user.findFirst({
        where: eq(user.id, userId),
    });

    if (!userData) throw new Error("User not found");

    const daysPerWeek = userData.availableDaysPerWeek ?? 5;
    const hoursPerDay = userData.availableHoursPerDay ?? 2;
    let preferredStartTime = userData.preferredStartTime ?? DEFAULT_START_TIME;
    
    if (preferredStartTime.split(":").length === 2) {
        preferredStartTime += ":00";
    }

    const activeRoadmap = await db.query.roadmaps.findFirst({
        where: and(eq(roadmaps.userId, userId), eq(roadmaps.isActive, true)),
    });

    if (!activeRoadmap) return []; 

    const timeZone = userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

    // Parse "YYYY-MM-DD" as UTC noon to safely add days without timezone/DST shifts
    const windowStart = new Date(`${todayStr}T12:00:00Z`);

    const availableWeekdays = userData.availableWeekdays && userData.availableWeekdays.length > 0 
        ? userData.availableWeekdays 
        : (WEEKDAY_MAP[daysPerWeek] || WEEKDAY_MAP[5]);

    await db.delete(calendarEvents)
        .where(
            and(
                eq(calendarEvents.userId, userId),
                eq(calendarEvents.status, "scheduled")
            )
        );

    const unfinishedNodes = await db
        .select({
            id: roadmapNodes.id,
            estimatedDurationHours: skillCurriculumNodes.estimatedDurationHours,
            title: skillCurriculumNodes.title,
            description: skillCurriculumNodes.description,
        })
        .from(roadmapNodes)
        .innerJoin(skillCurriculumNodes, eq(roadmapNodes.curriculumNodeId, skillCurriculumNodes.id))
        .where(
            and(
                eq(roadmapNodes.roadmapId, activeRoadmap.id),
                inArray(roadmapNodes.status, ["pending", "inProgress"])
            )
        )
        .orderBy(asc(roadmapNodes.orderIndex));

    let candidateDates: string[] = [];
    for (let i = 0; i <= 13; i++) {
        const d = new Date(windowStart);
        d.setUTCDate(windowStart.getUTCDate() + i);
        if (availableWeekdays && availableWeekdays.includes(d.getUTCDay())) {
            candidateDates.push(d.toISOString().split('T')[0]!);
        }
    }

    const existingEventsForUnfinished = await db
        .select({
            roadmapNodeId: calendarEvents.roadmapNodeId,
            sessionIndex: calendarEvents.sessionIndex,
            startTime: calendarEvents.startTime,
            endTime: calendarEvents.endTime,
        })
        .from(calendarEvents)
        .where(
            and(
                eq(calendarEvents.userId, userId),
                unfinishedNodes.length > 0 ? inArray(calendarEvents.roadmapNodeId, unfinishedNodes.map(n => n.id)) : undefined
            )
        );

    const maxSessionIndexMap = new Map<string, number>();
    const completedDurationMap = new Map<string, number>();

    for (const e of existingEventsForUnfinished) {
        const current = maxSessionIndexMap.get(e.roadmapNodeId) || 0;
        if (e.sessionIndex > current) {
            maxSessionIndexMap.set(e.roadmapNodeId, e.sessionIndex);
        }
        
        const currentDuration = completedDurationMap.get(e.roadmapNodeId) || 0;
        const start = new Date(`1970-01-01T${e.startTime}Z`);
        const end = new Date(`1970-01-01T${e.endTime}Z`);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        completedDurationMap.set(e.roadmapNodeId, currentDuration + durationHours);
    }

    // Get all events from today onwards to calculate already used hours per day
    const futureOrTodayEvents = await db
        .select({
            date: calendarEvents.date,
            startTime: calendarEvents.startTime,
            endTime: calendarEvents.endTime,
        })
        .from(calendarEvents)
        .where(
            and(
                eq(calendarEvents.userId, userId),
                gte(calendarEvents.date, todayStr!)
            )
        );

    const dateHoursUsedMap = new Map<string, number>();
    for (const e of futureOrTodayEvents) {
        if (!e.date) continue;
        const start = new Date(`1970-01-01T${e.startTime}Z`);
        const end = new Date(`1970-01-01T${e.endTime}Z`);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const current = dateHoursUsedMap.get(e.date) || 0;
        dateHoursUsedMap.set(e.date, current + durationHours);
    }

    const eventsToCreate: typeof calendarEvents.$inferInsert[] = [];
    let dateIndex = 0;
    let hoursUsedToday = dateHoursUsedMap.get(candidateDates[dateIndex] || "") || 0;

    for (const node of unfinishedNodes) {
        const completedHours = completedDurationMap.get(node.id) || 0;
        let remainingDuration = Math.max(0, (node.estimatedDurationHours || 2) - completedHours);
        
        if (remainingDuration <= 0) continue;

        let sessionIndex = (maxSessionIndexMap.get(node.id) || 0) + 1;
        const totalSessionsForNode = Math.ceil((node.estimatedDurationHours || 2) / hoursPerDay);

        while (remainingDuration > 0) {
            if (dateIndex >= candidateDates.length) break;

            while (hoursUsedToday >= hoursPerDay) {
                dateIndex++;
                hoursUsedToday = dateHoursUsedMap.get(candidateDates[dateIndex] || "") || 0;
                if (dateIndex >= candidateDates.length) break;
            }
            if (dateIndex >= candidateDates.length) break;

            const date = candidateDates[dateIndex] || "";
            const sessionDuration = Math.min(remainingDuration, hoursPerDay - hoursUsedToday);
            
            const sessionStartTime = addHoursToTime(preferredStartTime, hoursUsedToday);
            const endTimeStr = addHoursToTime(sessionStartTime, sessionDuration);

            eventsToCreate.push({
                userId,
                roadmapNodeId: node.id,
                sessionIndex,
                totalSessionsForNode, // This might not be perfectly accurate if sessions are split unevenly, but it's close enough for the UI.
                date,
                startTime: sessionStartTime,
                endTime: endTimeStr,
                status: "scheduled",
            });

            hoursUsedToday += sessionDuration;
            remainingDuration -= sessionDuration;
            sessionIndex++;
        }
        if (dateIndex >= candidateDates.length) break;
    }

    let insertedEvents: (typeof calendarEvents.$inferSelect)[] = [];
    if (eventsToCreate.length > 0) {
        insertedEvents = await db.insert(calendarEvents).values(eventsToCreate).returning();
    }

    const nodeMap = new Map(unfinishedNodes.map(n => [n.id, n]));

    return insertedEvents.map(event => ({
        event,
        nodeTitle: nodeMap.get(event.roadmapNodeId)?.title,
        nodeDescription: nodeMap.get(event.roadmapNodeId)?.description,
    }));
}
