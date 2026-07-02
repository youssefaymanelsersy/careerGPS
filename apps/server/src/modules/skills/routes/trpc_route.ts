import { z } from "zod";
import { router, protectedProcedure } from "@/trpc/index";
import { db } from "@/db";
import { skills, skillDependencies, userSkills, user } from "@/db/schema";
import { addManualSkill, bulkAddManualSkills } from "@/modules/skills/service";
import { and, eq, inArray, ilike, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const skillsRouter = router({
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().trim().min(1),
                hasNoDependencies: z.boolean(),
                dependencyIds: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { name, hasNoDependencies, dependencyIds } = input;
            const uniqueDependencyIds: string[] = [...new Set(dependencyIds ?? [])];

            return db.transaction(async (tx) => {
                if (hasNoDependencies && uniqueDependencyIds.length > 0) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                        "Skill marked hasNoDependencies cannot have dependencies."
                    });
                }

                if (!hasNoDependencies && uniqueDependencyIds.length === 0) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                        "Skill must have dependencies or be marked hasNoDependencies = true."
                    });
                }

                const inserted = await tx
                    .insert(skills)
                    .values({
                        name,
                        hasNoDependencies,
                    })
                    .returning();

                const skill = inserted[0];
                if (!skill) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Skill insert failed",
                    });
                }
                const createdSkill = skill;

                if (uniqueDependencyIds.length === 0) {
                    return createdSkill;
                }

                const existingDependencies = await tx
                    .select({ id: skills.id })
                    .from(skills)
                    .where(inArray(skills.id, uniqueDependencyIds));

                const existingDependencyIds = new Set(
                    existingDependencies.map((row) => row.id)
                );

                const missingDependencies = uniqueDependencyIds.filter(
                    (id) => !existingDependencyIds.has(id)
                );

                if (missingDependencies.length > 0) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Dependency skills not found: ${missingDependencies.join(", ")}`,
                    });
                }

                // ---- CYCLE DETECTION ----

                const visited = new Set<string>();

                async function dfs(currentSkillId: string): Promise<boolean> {
                    if (currentSkillId === createdSkill.id) {
                        return true; // cycle found
                    }

                    if (visited.has(currentSkillId)) return false;
                    visited.add(currentSkillId);

                    const deps = await tx
                        .select()
                        .from(skillDependencies)
                        .where(eq(skillDependencies.skillId, currentSkillId));

                    for (const dep of deps) {
                        if (await dfs(dep.dependsOnSkillId)) {
                            return true;
                        }
                    }

                    return false;
                }

                for (const depId of uniqueDependencyIds) {
                    if (depId === createdSkill.id) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Skill cannot depend on itself.",
                        });
                    }

                    const cycle = await dfs(depId);
                    if (cycle) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Circular dependency detected.",
                        });
                    }
                }

                // ---- INSERT DEPENDENCIES ----

                await tx.insert(skillDependencies).values(
                    uniqueDependencyIds.map((depId) => ({
                        skillId: createdSkill.id,
                        dependsOnSkillId: depId,
                    }))
                );

                return createdSkill;
            });
        }),

    addUserSkill: protectedProcedure
        .input(
            z.object({
                skillId: z.string().uuid(),
                strengthScore: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { skillId } = input;
            const userId = ctx.session.user.id;
            const strengthScore = clampStrength(input.strengthScore);

            const existingUser = await db.query.user.findFirst({
                where: eq(user.id, userId),
            });

            if (!existingUser) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User not found",
                });
            }

            const skill = await db.query.skills.findFirst({
                where: eq(skills.id, skillId),
            });

            if (!skill) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Skill not found",
                });
            }

            const insertedUserSkills = await db
                .insert(userSkills)
                .values({
                    userId,
                    skillId,
                    strengthScore: strengthScore.toString(),
                })
                .onConflictDoUpdate({
                    target: [userSkills.userId, userSkills.skillId],
                    set: {
                        strengthScore: strengthScore.toString(),
                    },
                })
                .returning();

            const userSkill = insertedUserSkills[0];
            if (!userSkill) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to save user skill",
                });
            }

            return {
                userId: userSkill.userId,
                skillId: userSkill.skillId,
                skillName: skill.name,
                strengthScore: Number(userSkill.strengthScore),
            };
        }),

    updateUserSkill: protectedProcedure
        .input(
            z.object({
                skillId: z.string().uuid(),
                strengthScore: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const strengthScore = clampStrength(input.strengthScore);

            const updated = await db
                .update(userSkills)
                .set({
                    strengthScore: strengthScore.toString(),
                })
                .where(
                    and(
                        eq(userSkills.userId, ctx.session.user.id),
                        eq(userSkills.skillId, input.skillId)
                    )
                )
                .returning();

            const userSkill = updated[0];

            if (!userSkill) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User skill not found",
                });
            }

            return {
                userId: ctx.session.user.id,
                skillId: input.skillId,
                strengthScore,
            };
        }),

    removeUserSkill: protectedProcedure
        .input(
            z.object({
                skillId: z.string().uuid(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const deleted = await db
                .delete(userSkills)
                .where(
                    and(
                        eq(userSkills.userId, ctx.session.user.id),
                        eq(userSkills.skillId, input.skillId)
                    )
                )
                .returning();

            if (deleted.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User skill not found",
                });
            }

            return { success: true };
        }),

    getUserSkills: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;
            const rows = await db
                .select({
                    userId: userSkills.userId,
                    skillId: userSkills.skillId,
                    skillName: skills.name,
                    strengthScore: userSkills.strengthScore,
                })
                .from(userSkills)
                .innerJoin(skills, eq(skills.id, userSkills.skillId))
                .where(eq(userSkills.userId, userId));

            return rows.map((row) => ({
                userId: row.userId,
                skillId: row.skillId,
                skillName: row.skillName,
                strengthScore: Number(row.strengthScore),
            }));
        }),
        
    getAllSkills: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(50),
            cursor: z.number().default(0),
            search: z.string().optional(),
        }).optional())
        .query(async ({ input }) => {
            const limit = input?.limit ?? 50;
            const offset = input?.cursor ?? 0;
            const search = input?.search;

            let conditions = search ? ilike(skills.name, `%${search}%`) : undefined;

            const items = await db.select().from(skills)
                .where(conditions)
                .orderBy(asc(skills.name))
                .limit(limit + 1)
                .offset(offset);
            
            let nextCursor: typeof offset | undefined = undefined;
            if (items.length > limit) {
                items.pop();
                nextCursor = offset + limit;
            }

            return {
                items,
                nextCursor,
            };
        }),

    addManualSkill: protectedProcedure
        .input(
            z.object({
                skillName: z.string().trim().min(1),
                level: z.enum(["beginner", "intermediate", "expert"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            return addManualSkill({
                userId: ctx.session.user.id,
                skillName: input.skillName,
                level: input.level
            });
        }),

    bulkSaveUserSkills: protectedProcedure
        .input(
            z.object({
                skills: z.array(z.object({
                    name: z.string().trim().min(1),
                    level: z.enum(["beginner", "intermediate", "expert"]),
                }))
            })
        )
        .mutation(async ({ input, ctx }) => {
            return bulkAddManualSkills({
                userId: ctx.session.user.id,
                skillsList: input.skills
            });
        }),
});

function clampStrength(value: number) {
    return Math.min(100, Math.max(0, value));
}
