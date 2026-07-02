import { z } from "zod";
import {
    completeRoadmapStep,
    generateLearningRoadmapByRoleName,
} from "@/modules/roadmap/service";
import { generateInternalRoadmapForStep } from "@/modules/roadmap/ai-planner";
import { router, protectedProcedure } from "@/trpc/index";
import { db } from "@/db";
import { roadmaps, roadmapSteps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
        
    getUserRoadmaps: protectedProcedure
        .query(async ({ ctx }) => {
            return db.query.roadmaps.findMany({
                where: eq(roadmaps.userId, ctx.session.user.id),
                with: {
                    steps: {
                        with: {
                            skill: true
                        }
                    }
                }
            });
        }),

    deleteUserRoadmap: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const deleted = await db.delete(roadmaps)
                .where(and(
                    eq(roadmaps.id, input.roadmapId),
                    eq(roadmaps.userId, ctx.session.user.id)
                ))
                .returning();
            
            if (!deleted[0]) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Roadmap not found or not owned by user" });
            }
            return { success: true };
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

    completeInternalStep: protectedProcedure
        .input(z.object({
            stepId: z.string().uuid(),
            internalStepId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const step = await db.query.roadmapSteps.findFirst({
                where: eq(roadmapSteps.id, input.stepId),
                with: {
                    roadmap: true
                }
            });

            if (!step || step.roadmap.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Roadmap step not found",
                });
            }

            const currentCompleted = Array.isArray(step.completedInternalSteps) 
                ? (step.completedInternalSteps as string[]) 
                : [];

            if (!currentCompleted.includes(input.internalStepId)) {
                currentCompleted.push(input.internalStepId);
                
                await db.update(roadmapSteps)
                    .set({ completedInternalSteps: currentCompleted })
                    .where(eq(roadmapSteps.id, input.stepId));
            }

            return { success: true, completedInternalSteps: currentCompleted };
        }),
});
