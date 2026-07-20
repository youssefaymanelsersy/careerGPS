import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/trpc/index";
import { db } from "@/db";
import {  curriculumNodeResources, skillCurriculumNodes, skills } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";



export const curriculumRouter = router({
    
    // Bulk insert which remove the old curriculum and add the new curriculum if curriculum already exists
    addCurriculumNodesForSkill: adminProcedure
        .input(
            z.array(
                z.object({
                    skillId: z.string().uuid(),
                    nodes: z.array(
                        z.object({
                            orderIndex: z.number().int().min(0),
                            title: z.string().trim().min(1),
                            description: z.string().trim().min(1),
                            estimatedDurationHours: z.number().int().min(1).optional(),
                        })
                    ).min(1),
                })
            ).min(1)
        )
        .mutation(async ({ input }) => {

            const inserted: any[] = [];
            const failed: any[] = [];
            for (const skill of input) {
                const existingSkill = await db.query.skills.findFirst({
                    where: eq(skills.id, skill.skillId),
                });

                if (!existingSkill) {
                    failed.push({
                        skillId: skill.skillId,
                        reason: "Skill not found",
                    });
                    continue;
                }

                const nodesToUpsert = skill.nodes.map((node) => ({
                    ...node,
                    skillId: skill.skillId,
                }));

                const result = await db
                    .insert(skillCurriculumNodes)
                    .values(nodesToUpsert)
                    .onConflictDoUpdate({
                        target: [skillCurriculumNodes.skillId, skillCurriculumNodes.orderIndex],
                        set: {
                            title: sql.raw(`excluded.title`),
                            description: sql.raw(`excluded.description`),
                            estimatedDurationHours: sql.raw(`COALESCE(excluded.estimated_duration_hours, skill_curriculum_nodes.estimated_duration_hours)`),
                        },
                    })
                    .returning();

                inserted.push(...result);
            }
           return {
                inserted,
                failed
            };
        }),

    updateCurriculumNodesForSkill: adminProcedure
        .input(
            z.object({
                skillId: z.string().uuid(),
                nodes: z.array(
                    z.object({
                        orderIndex: z.number().int().min(0),
                        title: z.string().trim().min(1),
                        description: z.string().trim().min(1),
                        estimatedDurationHours: z.number().int().min(1).optional(),
                    })
                ).min(1),
            })
        )
        .mutation(async ({ input }) => {
            const existingSkill = await db.query.skills.findFirst({
                where: eq(skills.id, input.skillId),
            });

            if (!existingSkill) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Skill not found",
                });
            }

            const nodesToUpsert = input.nodes.map((node) => ({
                ...node,
                skillId: input.skillId,
            }));

            const upserted = await db
                .insert(skillCurriculumNodes)
                .values(nodesToUpsert)
                .onConflictDoUpdate({
                    target: [skillCurriculumNodes.skillId, skillCurriculumNodes.orderIndex],
                    set: {
                        title: sql.raw(`excluded.title`),
                        description: sql.raw(`excluded.description`),
                        estimatedDurationHours: sql.raw(`COALESCE(excluded.estimated_duration_hours, skill_curriculum_nodes.estimated_duration_hours)`),
                    },
                })
                .returning();

            return upserted;
        }),

    getCurriculumNodes: protectedProcedure
        .input(z.object({ skillId: z.string().uuid() }))
        .query(async ({ input }) => {
            const nodes = await db.query.skillCurriculumNodes.findMany({
                where: eq(skillCurriculumNodes.skillId, input.skillId),
                orderBy: asc(skillCurriculumNodes.orderIndex),
                with: {
                    resources: {
                        orderBy: asc(curriculumNodeResources.displayOrder),
                    },
                },
            });

            if (!nodes || nodes.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "No curriculum nodes found for this skill" });
            }

            return nodes;
        }),

    updateCurriculumNode: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                orderIndex: z.number().int().min(0).optional(),
                title: z.string().trim().min(1).optional(),
                description: z.string().trim().min(1).optional(),
                estimatedDurationHours: z.number().int().min(1).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const existing = await db.query.skillCurriculumNodes.findFirst({ where: eq(skillCurriculumNodes.id, input.id) });
            if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Curriculum node not found" });

            const updatePayload: Record<string, unknown> = {};
            if (typeof input.orderIndex === "number") updatePayload.orderIndex = input.orderIndex;
            if (typeof input.title === "string") updatePayload.title = input.title;
            if (typeof input.description === "string") updatePayload.description = input.description;
            if (typeof input.estimatedDurationHours === "number") updatePayload.estimatedDurationHours = input.estimatedDurationHours;

            const updated = await db.update(skillCurriculumNodes).set(updatePayload).where(eq(skillCurriculumNodes.id, input.id)).returning();
            return updated[0];
        }), 

    deleteCurriculumNode: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
            const existing = await db.query.skillCurriculumNodes.findFirst({
                where: eq(skillCurriculumNodes.id, input.id),
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Curriculum node not found" });
            }

            await db.delete(skillCurriculumNodes).where(eq(skillCurriculumNodes.id, input.id));
            return { success: true };
        }),

    reorderCurriculumNode: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                direction: z.enum(["up", "down"]),
            })
        )
        .mutation(async ({ input }) => {
            const node = await db.query.skillCurriculumNodes.findFirst({
                where: eq(skillCurriculumNodes.id, input.id),
            });

            if (!node) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Node not found" });
            }

            const allNodes = await db.query.skillCurriculumNodes.findMany({
                where: eq(skillCurriculumNodes.skillId, node.skillId),
                orderBy: asc(skillCurriculumNodes.orderIndex),
            });

            const currentIndex = allNodes.findIndex((n) => n.id === node.id);
            if (currentIndex === -1) return { success: false };

            if (input.direction === "up" && currentIndex > 0) {
                const prevNode = allNodes[currentIndex - 1];
                await db.transaction(async (tx) => {
                    await tx.update(skillCurriculumNodes).set({ orderIndex: -1 }).where(eq(skillCurriculumNodes.id, node.id));
                    await tx.update(skillCurriculumNodes).set({ orderIndex: node.orderIndex }).where(eq(skillCurriculumNodes.id, prevNode!.id));
                    await tx.update(skillCurriculumNodes).set({ orderIndex: prevNode!.orderIndex }).where(eq(skillCurriculumNodes.id, node.id));
                });
            } else if (input.direction === "down" && currentIndex < allNodes.length - 1) {
                const nextNode = allNodes[currentIndex + 1];
                await db.transaction(async (tx) => {
                    await tx.update(skillCurriculumNodes).set({ orderIndex: -1 }).where(eq(skillCurriculumNodes.id, node.id));
                    await tx.update(skillCurriculumNodes).set({ orderIndex: node.orderIndex }).where(eq(skillCurriculumNodes.id, nextNode!.id));
                    await tx.update(skillCurriculumNodes).set({ orderIndex: nextNode!.orderIndex }).where(eq(skillCurriculumNodes.id, node.id));
                });
            }

            return { success: true };
        }),
});