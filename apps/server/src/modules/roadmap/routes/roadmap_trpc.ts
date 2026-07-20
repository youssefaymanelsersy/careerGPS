import { z } from "zod";
import {
    completeRoadmapNode,
    generateLearningRoadmap,
} from "@/modules/roadmap/service";
import { router, protectedProcedure, adminProcedure } from "@/trpc/index";
import { db } from "@/db";
import { roadmaps, roadmapNodes, skillCurriculumNodes, calendarEvents } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const roadmapRouter = router({
    generate: protectedProcedure
        .input(
            z.object({
                roleId: z.uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await generateLearningRoadmap({
                userId: ctx.session.user.id,
                roleId: input.roleId,
            });

            if ("message" in result) {
                return result;
            }

            return {
                roadmapId: result.roadmapId,
                totalNodes: result.totalNodes,
                nodes: result.nodes,
                skillsMissingCurriculum: result.skillsMissingCurriculum
            };
        }),

    syncAll: protectedProcedure
        .mutation(async ({ ctx }) => {
            const { syncAllUserRoadmaps } = await import("@/modules/roadmap/service");
            await syncAllUserRoadmaps(ctx.session.user.id);
            return { success: true };
        }),

    syncGlobalRoadmaps: adminProcedure
        .mutation(async () => {
            const { syncAllUserRoadmaps } = await import("@/modules/roadmap/service");
            const allUsers = await db.query.user.findMany({ columns: { id: true } });
            
            // Note: Since this could be very large, doing it synchronously in one API call might time out.
            // For now, it will work since the user base is small. In production, this should be sent to a queue.
            for (const u of allUsers) {
                try {
                    await syncAllUserRoadmaps(u.id);
                } catch (err) {
                    console.error(`Failed to sync roadmap for user ${u.id}`, err);
                }
            }
            return { success: true, usersSynced: allUsers.length };
        }),

    completeNode: protectedProcedure
        .input(
            z.object({
                nodeId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return completeRoadmapNode({
                userId: ctx.session.user.id,
                nodeId: input.nodeId,
            });
        }),

    getActiveRoadmap: protectedProcedure
        .input(z.object({ roleId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const roadmap = await db.query.roadmaps.findFirst({
                where: and(
                    eq(roadmaps.userId, ctx.session.user.id),
                    eq(roadmaps.roleId, input.roleId),
                    eq(roadmaps.isActive, true)
                ),
                with: {
                    nodes: {
                        columns: {
                            id: true,
                            orderIndex: true,
                            status: true,
                            completedAt: true,
                            priority: true,
                        },
                        orderBy: asc(roadmapNodes.orderIndex),
                        with: {
                            curriculumNode: {
                                columns: {
                                    title: true,
                                    skillId: true,
                                    estimatedDurationHours: true,
                                },
                                with: {
                                    skill: {
                                        columns: {
                                            name: true,
                                        },
                                    },
                                }
                            }
                        }
                    }
                }
            });

            if (!roadmap) {
                return null;
            }

            return {
                roadmapId: roadmap.id,
                totalNodes: roadmap.nodes.length,
                nodes: roadmap.nodes.map((node) => ({
                    orderIndex: node.orderIndex,
                    nodeId: node.id,
                    status: node.status,
                    curriculumTitle: node.curriculumNode.title,
                    skillName: node.curriculumNode.skill.name,
                    priority: node.priority,
                    completedAt: node.completedAt,
                    estimatedDurationHours: node.curriculumNode.estimatedDurationHours,
                })),
            };
        }),

    getUserRoadmaps: protectedProcedure
        .query(async ({ ctx }) => {
            return db.query.roadmaps.findMany({
                where: eq(roadmaps.userId, ctx.session.user.id),
                with: {
                    nodes: {
                        with: {
                            curriculumNode: {
                                with: {
                                    skill: true,
                                }
                            }
                        }
                    }
                }
            });
        }),

    deleteUserRoadmap: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.roadmaps.findFirst({
                where: and(
                    eq(roadmaps.id, input.roadmapId),
                    eq(roadmaps.userId, ctx.session.user.id)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Roadmap not found"
                });
            }

            await db.delete(roadmaps).where(eq(roadmaps.id, input.roadmapId));
            return { success: true };
        }),

    getNodeInfo: protectedProcedure
        .input(z.object({ nodeId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const node = await db.query.roadmapNodes.findFirst({
                columns: {
                    curriculumNodeId: true
                },
                where: eq(roadmapNodes.id, input.nodeId),
                with: { roadmap: true }
            });

            if (!node) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Node not found"
                });
            }

            if (node.roadmap.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this node" });
            }

            return await db.query.skillCurriculumNodes.findFirst({
                where: eq(skillCurriculumNodes.id, node.curriculumNodeId),
                with: {
                    resources: true
                }
            });
        }),


    markNodeAsMastered: protectedProcedure
        .input(z.object({ nodeId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const node = await db.query.roadmapNodes.findFirst({
                where: eq(roadmapNodes.id, input.nodeId),
                with: { roadmap: true }
            });

            if (!node || node.roadmap.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Node not found or unauthorized" });
            }

            // 1. Mark node as completed
            await db.update(roadmapNodes)
                .set({ status: "completed", completedAt: new Date() })
                .where(eq(roadmapNodes.id, input.nodeId));

            // 2. Delete all future scheduled events for this node
            await db.delete(calendarEvents)
                .where(
                    and(
                        eq(calendarEvents.userId, ctx.session.user.id),
                        eq(calendarEvents.roadmapNodeId, input.nodeId),
                        eq(calendarEvents.status, "scheduled")
                    )
                );

            return { success: true };
        }),
});


