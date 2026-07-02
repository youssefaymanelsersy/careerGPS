import { z } from "zod";
import {
    completeRoadmapStep,
    generateLearningRoadmapByRoleName,
} from "@/modules/guidance/service";
import { generateInternalRoadmapForStep } from "@/modules/guidance/ai-planner";
import { router, protectedProcedure } from "@/trpc/index";
import { db } from "@/db";
import { roadmaps } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const roadmapRouter = router({
    generate: protectedProcedure
        .input(
            z.object({
                roleName: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await generateLearningRoadmapByRoleName({
                userId: ctx.session.user.id,
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

    completeStep: protectedProcedure
        .input(
            z.object({
                stepId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return completeRoadmapStep({
                userId: ctx.session.user.id,
                stepId: input.stepId,
            });
        }),

    getActiveRoadmap: protectedProcedure
        .input(z.object({ roleId: z.string() }))
        .query(async ({ ctx, input }) => {
            return db.query.roadmaps.findFirst({
                where: and(
                    eq(roadmaps.userId, ctx.session.user.id),
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
        
    generateSkillInternalRoadmap: protectedProcedure
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
