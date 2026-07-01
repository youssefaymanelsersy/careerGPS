import { env } from "@careergps/env/server";

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

    try {
        // Fallback or override logic depending on what the AI team exposes.
        const endpoint = env.AI_TEAM_URL ? `${env.AI_TEAM_URL}/roadmap-generate` : null;
        
        if (endpoint) {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: skillName,
                    days: daysAvailable,
                    minutes: minutesPerDay,
                    level
                }),
            });
            
            if (res.ok) {
                return await res.json();
            }
        }
        
        // Mock generation algorithm if AI endpoint isn't fully available yet
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
        
    } catch (error) {
        console.error("AI Planner service failed:", error);
        throw error;
    }
}
