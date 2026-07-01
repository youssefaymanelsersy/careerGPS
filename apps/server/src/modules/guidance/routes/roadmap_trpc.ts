import { z } from "zod";
import {
    completeRoadmapStep,
    generateLearningRoadmapByRoleName,
} from "@/modules/guidance/service";
import { generateSkillPlan, generateInternalRoadmapForStep } from "@/modules/guidance/ai-planner";
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
        
    generateSkillInternalRoadmap: publicProcedure
        .input(z.object({ 
            stepId: z.string().uuid(),
            durationDays: z.number().min(1).max(730).default(14), 
            dailyMinutes: z.number().min(15).max(720).default(60) 
        }))
        .mutation(async ({ input }) => {
            return generateInternalRoadmapForStep({
                stepId: input.stepId,
                durationDays: input.durationDays,
                dailyMinutes: input.dailyMinutes
            });
        }),
});
