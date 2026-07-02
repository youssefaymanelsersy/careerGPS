// import { env } from "@careergps/env/server";
import { db } from "@/db";
import { roadmapSteps, cachedInternalRoadmaps } from "./db/schema";
import { userSkills} from "@/modules/skills/db/schema";
// import { roadmaps } from "./db/schema";
import { eq, and } from "drizzle-orm";

export async function generateInternalRoadmapForStep({
    stepId,
    durationDays = 14,
    dailyMinutes = 60
}: {
    stepId: string;
    durationDays?: number;
    dailyMinutes?: number;
}) {
    // 1. Fetch the step, roadmap, and skill
    const step = await db.query.roadmapSteps.findFirst({
        where: eq(roadmapSteps.id, stepId),
        with: {
            skill: true,
            roadmap: true,
        }
    });

    if (!step) {
        throw new Error("Roadmap step not found.");
    }

    // If it already has a cached roadmap attached, just return that
    if (step.cachedRoadmapId) {
        const cached = await db.query.cachedInternalRoadmaps.findFirst({
            where: eq(cachedInternalRoadmaps.id, step.cachedRoadmapId)
        });
        if (cached) {
            return cached.roadmapData;
        }
    }

    // 2. Fetch the user's skill level to determine beginner/intermediate/advanced
    const uSkill = await db.query.userSkills.findFirst({
        where: and(
            eq(userSkills.userId, step.roadmap.userId),
            eq(userSkills.skillId, step.skillId)
        )
    });

    const currentStrength = uSkill ? Number(uSkill.strengthScore) : 0;
    
    let level = "beginner";
    if (currentStrength >= 60) level = "advanced";
    else if (currentStrength >= 30) level = "intermediate";

    // 3. Check the global cache to see if this exact combo has been generated before
    const existingCache = await db.query.cachedInternalRoadmaps.findFirst({
        where: and(
            eq(cachedInternalRoadmaps.skillId, step.skillId),
            eq(cachedInternalRoadmaps.level, level),
            eq(cachedInternalRoadmaps.durationDays, String(durationDays)),
            eq(cachedInternalRoadmaps.dailyMinutes, String(dailyMinutes))
        )
    });

    if (existingCache) {
        // Link it to the user's step
        await db.update(roadmapSteps)
            .set({ cachedRoadmapId: existingCache.id })
            .where(eq(roadmapSteps.id, stepId));
            
        return existingCache.roadmapData;
    }

    // 4. Cache miss! Call the HuggingFace API.
    try {
        const apiKey = process.env.HF_API_KEY || "";
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (apiKey) {
            headers["X-API-Key"] = apiKey;
        }

        const res = await fetch("https://mo-medhat-roadmap-generator.hf.space/api/generate", {
            method: "POST",
            headers,
            body: JSON.stringify({
                goal: step.skill.name,
                duration_days: durationDays,
                daily_minutes: dailyMinutes,
                level: level
            }),
        });
        
        if (!res.ok) {
            console.error(`HF API returned ${res.status}: ${await res.text()}`);
            // Fallback to mock logic if the API is failing or missing key
            const mockData = await generateSkillPlan({
                skillName: step.skill.name,
                currentStrength,
                daysAvailable: durationDays,
                minutesPerDay: dailyMinutes
            });
            // We can return the mock directly or format it to look like the HF response
            return {
                goal: step.skill.name,
                duration_days: durationDays,
                milestones: [],
                first_week_plan: { "Day 1": mockData.schedule }
            };
        }

        const roadmapData = await res.json();

        // 5. Save to global cache
        const [insertedCache] = await db.insert(cachedInternalRoadmaps).values({
            skillId: step.skillId,
            level,
            durationDays: String(durationDays),
            dailyMinutes: String(dailyMinutes),
            roadmapData: roadmapData
        }).returning();

        // 6. Link to user's step
        await db.update(roadmapSteps)
            .set({ cachedRoadmapId: insertedCache.id })
            .where(eq(roadmapSteps.id, stepId));

        return roadmapData;
        
    } catch (error) {
        console.error("AI Planner service failed to fetch from HF:", error);
        throw error;
    }
}

// Keep the old function for backwards compatibility just in case
export async function generateSkillPlan({
    skillName,
    currentStrength,
    daysAvailable = 7,
    minutesPerDay = 60
}: {
    skillName: string;
    currentStrength: number;
    daysAvailable?: number;
    minutesPerDay?: number;
}) {
    let level = "beginner";
    if (currentStrength >= 60) level = "advanced";
    else if (currentStrength >= 30) level = "intermediate";

    const steps = [];
    const minutesPerStep = Math.min(minutesPerDay, 120);
    
    for(let i = 1; i <= daysAvailable; i++) {
        steps.push({
            day: i,
            title: `${skillName} Deep Dive - Phase ${i}`,
            duration: `${minutesPerStep} mins`,
            description: `Focus on fundamental concepts and practical implementation of ${skillName} appropriate for a ${level} level developer.`
        });
    }
    
    return {
        skill: skillName,
        level,
        totalDays: daysAvailable,
        schedule: steps
    };
}
