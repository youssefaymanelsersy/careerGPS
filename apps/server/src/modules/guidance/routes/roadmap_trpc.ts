import { z } from "zod";
import {
    completeRoadmapStep,
    generateLearningRoadmapByRoleName,
} from "@/modules/guidance/service";
import { generateSkillPlan } from "@/modules/guidance/ai-planner";
import { router, publicProcedure } from "@/trpc/index";
import { db } from "@/db";
import { roadmaps } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const roadmapRouter = router({
    generate: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                roleName: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const result = await generateLearningRoadmapByRoleName({
                userId: input.userId,
                roleName: input.roleName,
            });

            if ("message" in result) {
                return result;
            }

            return {
                totalSteps: result.totalSteps,
                roadmap: result.roadmap,
            };
        }),

    completeStep: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                stepId: z.string().uuid(),
            })
        )
        .mutation(async ({ input }) => {
            return completeRoadmapStep({
                userId: input.userId,
                stepId: input.stepId,
            });
        }),

    getActiveRoadmap: publicProcedure
        .input(z.object({ userId: z.string(), roleId: z.string() }))
        .query(async ({ input }) => {
            return db.query.roadmaps.findFirst({
                where: and(
                    eq(roadmaps.userId, input.userId),
                    eq(roadmaps.roleId, input.roleId),
                    eq(roadmaps.isActive, true)
                ),
                with: {
                    steps: {
                        with: {
                            skill: true
                        }
                    }
                }
            });
        }),
        
    aiPlan: publicProcedure
        .input(z.object({ 
            skillName: z.string(), 
            currentStrength: z.number(), 
            daysAvailable: z.number().optional(), 
            minutesPerDay: z.number().optional() 
        }))
        .mutation(async ({ input }) => {
            return generateSkillPlan({
                skillName: input.skillName,
                currentStrength: input.currentStrength,
                daysAvailable: input.daysAvailable,
                minutesPerDay: input.minutesPerDay
            });
        }),
});
