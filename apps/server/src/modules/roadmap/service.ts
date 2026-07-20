import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, asc, lt, ne } from "drizzle-orm";
import { evaluateUserForRole } from "@/modules/roles/service";
import { dispatchNotification } from "@/modules/notifications/services/notifications.service";
import { settleStreak } from "@/modules/streaks/services/streak.service";

import { db } from "@/db";
import {
    roles,
    roleSkills,
    userSkills,
    skillGapResults,
    roadmaps,
    roadmapNodes,
    skillCurriculumNodes,
    curriculumNodeResources,
    skills,
    skillDependencies,
    calendarEvents,
} from "@/db/schema";
import { normalizeSkillName } from "@/modules/github/utils";

export const WEAK_SKIP_FACTOR = 0.6;

export function nodesToSkip(strength: number, totalNodes: number): number {
    if (strength === 0) return 0;
    const skipFraction = (strength / 100) * WEAK_SKIP_FACTOR;
    const skipCount = Math.floor(totalNodes * skipFraction);
    // Never skip all nodes; leave at least one
    return Math.min(skipCount, Math.max(totalNodes - 1, 0));
}

export function topologicallySortSkills(
    roadmapMap: Map<string, { skillId: string; skillName: string; weight: number; priorityScore: number; priority: "high" | "medium" }>,
    dependencies: { skillId: string; dependsOnSkillId: string }[]
): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of roadmapMap.keys()) {
        graph.set(id, []);
        inDegree.set(id, 0);
    }

    for (const dep of dependencies) {
        if (!roadmapMap.has(dep.dependsOnSkillId)) continue;
        if (!roadmapMap.has(dep.skillId)) continue;

        graph.get(dep.dependsOnSkillId)?.push(dep.skillId);
        inDegree.set(dep.skillId, (inDegree.get(dep.skillId) ?? 0) + 1);
    }

    const queue: string[] = [];

    for (const [id, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(id);
        }
    }

    const sorted: string[] = [];

    while (queue.length > 0) {
        queue.sort((a, b) => {
            const A = roadmapMap.get(a)!;
            const B = roadmapMap.get(b)!;

            const pDiff = B.priorityScore - A.priorityScore;

            if (pDiff !== 0) return pDiff;

            return B.weight - A.weight;
        });

        const current = queue.shift()!;
        sorted.push(current);

        for (const neighbor of graph.get(current) ?? []) {
            inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1);

            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length !== roadmapMap.size) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Dependency cycle detected in roadmap generation.",
        });
    }

    return sorted;
}

export async function generateLearningRoadmap({
    userId,
    roleId,
}: {
    userId: string;
    roleId: string;
}) {
    const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
    });

    if (!role) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Role \"${roleId}\" not found.`,
        });
    }

    return generateLearningRoadmapInternal({ userId, roleId: role.id });
}

export async function generateLearningRoadmapByRoleName({
    userId,
    roleId,
}: {
    userId: string;
    roleId: string;
}) {
    const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
    });

    if (!role) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Role "${roleId}" not found.`,
        });
    }

    return generateLearningRoadmapInternal({ userId, roleId: roleId });
}

export async function syncAllUserRoadmaps(userId: string) {
    const userRoadmaps = await db
        .select({ roleId: roadmaps.roleId })
        .from(roadmaps)
        .where(eq(roadmaps.userId, userId));

    const uniqueRoleIds = Array.from(new Set(userRoadmaps.map(r => r.roleId)));

    for (const roleId of uniqueRoleIds) {
        try {
            await generateLearningRoadmapInternal({ userId, roleId });
        } catch (error) {
            console.error(`Failed to sync roadmap for user ${userId} role ${roleId}`, error);
        }
    }
}

export async function completeRoadmapNode({
    userId,
    nodeId,
}: {
    userId: string;
    nodeId: string;
}) {
    const matchingNode = await db
        .select({
            nodeId: roadmapNodes.id,
            roadmapId: roadmapNodes.roadmapId,
            curriculumNodeId: roadmapNodes.curriculumNodeId,
            status: roadmapNodes.status,
            roadmapUserId: roadmaps.userId,
            orderIndex: roadmapNodes.orderIndex,
            skillId: skillCurriculumNodes.skillId,
        })
        .from(roadmapNodes)
        .innerJoin(roadmaps, eq(roadmaps.id, roadmapNodes.roadmapId))
        .innerJoin(skillCurriculumNodes, eq(skillCurriculumNodes.id, roadmapNodes.curriculumNodeId))
        .where(
            and(
                eq(roadmapNodes.id, nodeId),
                eq(roadmaps.userId, userId)
            )
        )
        .limit(1);

    const node = matchingNode[0];

    if (!node) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Roadmap node not found for this user",
        });
    }

    if (node.status === "completed") {
        return { alreadyCompleted: true };
    }

    const earlierUncompletedNodes = await db
        .select()
        .from(roadmapNodes)
        .innerJoin(skillCurriculumNodes, eq(skillCurriculumNodes.id, roadmapNodes.curriculumNodeId))
        .where(
            and(
                eq(roadmapNodes.roadmapId, node.roadmapId),
                eq(skillCurriculumNodes.skillId, node.skillId),
                lt(roadmapNodes.orderIndex, node.orderIndex),
                ne(roadmapNodes.status, "completed")
            )
        )
        .limit(1);

    if (earlierUncompletedNodes.length > 0) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must complete earlier nodes in this skill first.",
        });
    }

    await db
        .update(roadmapNodes)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(roadmapNodes.id, node.nodeId));

    await db
        .delete(calendarEvents)
        .where(
            and(
                eq(calendarEvents.roadmapNodeId, node.nodeId),
                eq(calendarEvents.status, "scheduled")
            )
        );

    const firstPendingNode = await db
        .select()
        .from(roadmapNodes)
        .where(
            and(
                eq(roadmapNodes.roadmapId, node.roadmapId),
                eq(roadmapNodes.status, "pending")
            )
        )
        .orderBy(asc(roadmapNodes.orderIndex))
        .limit(1);

    if (firstPendingNode[0]) {
        await db
            .update(roadmapNodes)
            .set({ status: "inProgress" })
            .where(eq(roadmapNodes.id, firstPendingNode[0]!.id));
    }

    const remainingUncompleted = await db
        .select()
        .from(roadmapNodes)
        .innerJoin(skillCurriculumNodes, eq(skillCurriculumNodes.id, roadmapNodes.curriculumNodeId))
        .where(
            and(
                eq(roadmapNodes.roadmapId, node.roadmapId),
                eq(skillCurriculumNodes.skillId, node.skillId),
                ne(roadmapNodes.status, "completed")
            )
        )
        .limit(1);

    let skillFullyCompleted = remainingUncompleted.length === 0;

    const curriculumNode = await db.query.skillCurriculumNodes.findFirst({
        where: eq(skillCurriculumNodes.id, node.curriculumNodeId),
    });

    if (!curriculumNode) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Curriculum node not found.",
        });
    }

    const currentUserSkill = await db.query.userSkills.findFirst({
        where: and(
            eq(userSkills.userId, userId),
            eq(userSkills.skillId, curriculumNode.skillId)
        ),
    });

    const currentStrength = currentUserSkill
        ? clamp(Number(currentUserSkill.strengthScore), 0, 100)
        : 0;

    const skillCurriculumNodesForSkill = await db.query.skillCurriculumNodes.findMany({
        where: eq(skillCurriculumNodes.skillId, curriculumNode.skillId),
        columns: { id: true },
    });

    const increment = skillCurriculumNodesForSkill.length > 0
        ? 100 / skillCurriculumNodesForSkill.length
        : 0;

    let newStrength = Math.min(currentStrength + increment, 100);
    newStrength = Number(newStrength.toFixed(2));

    await db
        .insert(userSkills)
        .values({
            userId,
            skillId: curriculumNode.skillId,
            strengthScore: newStrength.toString(),
        })
        .onConflictDoUpdate({
            target: [userSkills.userId, userSkills.skillId],
            set: {
                strengthScore: newStrength.toString(),
            },
        });

    if (skillFullyCompleted) {
        const activeRoadmap = await db.query.roadmaps.findFirst({
            where: eq(roadmaps.id, node.roadmapId)
        });

        if (activeRoadmap) {
            await evaluateUserForRole({ userId, roleId: activeRoadmap.roleId });
        }

        await dispatchNotification({
            userId,
            type: "milestone_node_complete",
            channels: ["in_app", "push"],
            relatedEntityType: "roadmap_node",
            relatedEntityId: node.nodeId,
            payload: { skillId: curriculumNode.skillId }
        });
    }

    const todayStr = new Date().toISOString().split("T")[0]!;
    await settleStreak(userId, todayStr, true);

    return {
        nodeId: node.nodeId,
        status: "completed" as const,
        skillId: curriculumNode.skillId,
        skillFullyCompleted,
        previousStrength: currentStrength,
        newStrength,
    };
}

type RoadmapResource = {
    id: string;
    curriculumNodeId: string;
    title: string;
    type: string;
    url: string;
    displayOrder: number;
};

type RoadmapResponseNode = {
    step: number;
    nodeId: string | undefined;
    skillId: string;
    skillName: string;
    curriculumTitle: string;
    curriculumDescription: string;
    priority: "high" | "medium";
    resources: RoadmapResource[];
};

type PendingRoadmapNodeInsert = {
    curriculumNodeId: string;
    orderIndex: number;
    status: "pending" | "inProgress" | "completed";
    priority: "high" | "medium";
    completedAt?: Date | null;
};

type SkillDependencyRow = {
    skillId: string;
    dependsOnSkillId: string;
};

type SkillGapJson = {
    missing?: string[];
    weak?: string[];
};

async function generateLearningRoadmapInternal({
    userId,
    roleId,
}: {
    userId: string;
    roleId: string;
}) {
    await evaluateUserForRole( {userId , roleId} );

    const existingRoadmap = await db.query.roadmaps.findFirst({
        where: and(eq(roadmaps.userId, userId), eq(roadmaps.roleId, roleId)),
        with: {
            nodes: {
                columns: {
                    id: true,
                    curriculumNodeId: true,
                    status: true,
                    completedAt: true
                }
            }
        }
    });

    const completedNodesMap = new Map<string, { completedAt: Date | null }>();
    const inProgressNodesMap = new Map<string, boolean>();
    const calendarEventsCache = new Map<string, any[]>();
    
    if (existingRoadmap) {
        const { calendarEvents } = await import("@/modules/calendar/db/schema");
        const roadmapNodeIds = existingRoadmap.nodes.map(n => n.id);
        
        let existingEvents: any[] = [];
        if (roadmapNodeIds.length > 0) {
            existingEvents = await db.select().from(calendarEvents).where(inArray(calendarEvents.roadmapNodeId, roadmapNodeIds));
        }

        for (const node of existingRoadmap.nodes) {
            if (node.status === "completed") {
                completedNodesMap.set(node.curriculumNodeId, { completedAt: node.completedAt });
            } else if (node.status === "inProgress") {
                inProgressNodesMap.set(node.curriculumNodeId, true);
            }
            
            const eventsForNode = existingEvents.filter(e => e.roadmapNodeId === node.id);
            if (eventsForNode.length > 0) {
                calendarEventsCache.set(node.curriculumNodeId, eventsForNode);
            }
        }
    }

    const gapRows = await db
        .select()
        .from(skillGapResults)
        .where(and(eq(skillGapResults.userId, userId), eq(skillGapResults.roleId, roleId)))
        .orderBy(desc(skillGapResults.createdAt));

    if (gapRows.length === 0) {
        return { message: "No skill gaps found. You're ready." };
    }

    const gapRow = gapRows[0]!;
    const parsedGaps = typeof gapRow.missingSkills === "string"
        ? JSON.parse(gapRow.missingSkills)
        : gapRow.missingSkills || { missing: [], weak: [] };

    const typedGapsJson = parsedGaps as SkillGapJson;
    const allGapNames = [...(typedGapsJson.missing ?? []), ...(typedGapsJson.weak ?? [])];

    if (allGapNames.length === 0) {
        return { message: "No skill gaps found. You're ready." };
    }

    const normalizedGapNames = allGapNames.map(normalizeSkillName);

    const skillListGap = await db
        .select({
            id: skills.id,
            name: skills.name,
            normalizedName: skills.normalizedName,
        })
        .from(skills)
        .where(inArray(skills.normalizedName, normalizedGapNames));

    const gapSkillIds = skillListGap.map((skill) => skill.id);
    const normalizedMissing = new Set((typedGapsJson.missing ?? []).map(normalizeSkillName));

    const gaps = skillListGap.map((skill) => ({
        skillId: skill.id,
        gapType: normalizedMissing.has(skill.normalizedName) ? "missing" : "weak",
    }));

    const [roleSkillWeights, userSkillRows, dependencies] = await Promise.all([
        db.select({
            skillId: roleSkills.skillId,
            isCore: roleSkills.isCore,
        })
            .from(roleSkills)
            .where(eq(roleSkills.roleId, roleId)),
        db.select({
            skillId: userSkills.skillId,
            strengthScore: userSkills.strengthScore,
        })
            .from(userSkills)
            .where(eq(userSkills.userId, userId)),
        db.select({
            skillId: skillDependencies.skillId,
            dependsOnSkillId: skillDependencies.dependsOnSkillId,
        })
            .from(skillDependencies)
            .where(inArray(skillDependencies.skillId, gapSkillIds)),
    ]);

    const userStrengthBySkillId = new Map(
        userSkillRows.map((row) => [row.skillId, clamp(Number(row.strengthScore), 0, 100)])
    );

    const roleWeightBySkillId = new Map(
        roleSkillWeights.map((row) => [row.skillId, getRoleSkillWeight(row)])
    );

    const skillById = new Map(skillListGap.map((skill) => [skill.id, skill]));

    const roadmapMap = new Map<string, {
        skillId: string;
        skillName: string;
        weight: number;
        priorityScore: number;
        priority: "high" | "medium";
    }>();

    for (const gap of gaps) {
        const weight = roleWeightBySkillId.get(gap.skillId) ?? 0;
        const strength = userStrengthBySkillId.get(gap.skillId) ?? 0;
        const priorityScore = weight * (100 - strength);
        const skill = skillById.get(gap.skillId);

        roadmapMap.set(gap.skillId, {
            skillId: gap.skillId,
            skillName: skill?.name ?? "Unknown",
            weight,
            priorityScore,
            priority: gap.gapType === "missing" ? "high" : "medium",
        });
    }

    const sorted = topologicallySortSkills(roadmapMap, dependencies as SkillDependencyRow[]);

    const allCurriculumNodes = await db.query.skillCurriculumNodes.findMany({
        where: inArray(skillCurriculumNodes.skillId, sorted),
        orderBy: asc(skillCurriculumNodes.orderIndex),
        with: {
            resources: {
                orderBy: asc(curriculumNodeResources.displayOrder),
            },
        },
    });
    const curriculumBySkill = new Map<string, typeof allCurriculumNodes[number][]>();
    for (const node of allCurriculumNodes) {
        const skillNodes = curriculumBySkill.get(node.skillId) ?? [];
        skillNodes.push(node);
        curriculumBySkill.set(node.skillId, skillNodes);
    }

    const responseNodes: RoadmapResponseNode[] = [];
    const skillsMissingCurriculum: string[] = [];
    const pendingRoadmapNodeInserts: PendingRoadmapNodeInsert[] = [];
    let globalOrder = 1;

    for (const skillId of sorted) {
        const roadmapItem = roadmapMap.get(skillId)!;
        const skillNodes = curriculumBySkill.get(skillId);

        if (!skillNodes || skillNodes.length === 0) {
            skillsMissingCurriculum.push(roadmapItem.skillName);
            continue;
        }

        const skipCount = nodesToSkip(userStrengthBySkillId.get(skillId) ?? 0, skillNodes.length);
        const uncompletedNodes = skillNodes.slice(skipCount);
        
        // Ensure any previously completed nodes are included, even if they would be skipped
        const completedNodesForSkill = skillNodes.filter(node => completedNodesMap.has(node.id));
        
        // Merge them, ensuring no duplicates, and maintaining curriculum order
        const selectedNodesSet = new Set([...completedNodesForSkill, ...uncompletedNodes]);
        const selectedNodes = Array.from(selectedNodesSet).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        
        if (selectedNodes.length === 0 && skillNodes.length > 0) {
            selectedNodes.push(skillNodes[skillNodes.length - 1]!);
        }

        for (const node of selectedNodes) {
            const isCompleted = completedNodesMap.has(node.id);
            const isInProgress = inProgressNodesMap.has(node.id);

            pendingRoadmapNodeInserts.push({
                curriculumNodeId: node.id,
                orderIndex: globalOrder,
                status: isCompleted ? "completed" : (isInProgress ? "inProgress" : "pending"),
                priority: roadmapItem.priority,
                completedAt: isCompleted ? completedNodesMap.get(node.id)?.completedAt : null,
            });

            responseNodes.push({
                step: globalOrder,
                nodeId: undefined,
                skillId,
                skillName: roadmapItem.skillName,
                curriculumTitle: node.title,
                curriculumDescription: node.description,
                priority: roadmapItem.priority,
                resources: node.resources ?? [],
            });

            globalOrder += 1;
        }
    }

    if (pendingRoadmapNodeInserts.length === 0) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to generate roadmap: no curriculum nodes available for this role.",
        });
    }
    const { roadmap, insertedNodes } = await db.transaction(async (tx) => {
        await tx
            .delete(roadmaps)
            .where(and(eq(roadmaps.userId, userId), eq(roadmaps.roleId, roleId)));

        const [createdRoadmap] = await tx
            .insert(roadmaps)
            .values({
                title: "Your Learning Roadmap",
                userId,
                roleId,
                isActive: true,
            })
            .returning();

        if (!createdRoadmap) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create roadmap",
            });
        }
        const roadmapNodeInserts = pendingRoadmapNodeInserts.map((values) => ({
            roadmapId: createdRoadmap.id,
            ...values,
        }));
        
        const insertedRoadmapNodes = await tx
            .insert(roadmapNodes)
            .values(roadmapNodeInserts)
            .returning();

        const alreadyInProgress = insertedRoadmapNodes.some(n => n.status === "inProgress");
        if (!alreadyInProgress) {
            const firstPending = insertedRoadmapNodes.find(n => n.status === "pending");
            if (firstPending) {
                await tx
                    .update(roadmapNodes)
                    .set({ status: "inProgress" })
                    .where(eq(roadmapNodes.id, firstPending.id));
                
                firstPending.status = "inProgress";
            }
        }

        const calendarEventInserts = [];
        for (const insertedNode of insertedRoadmapNodes) {
            const events = calendarEventsCache.get(insertedNode.curriculumNodeId);
            if (events && events.length > 0) {
                for (const event of events) {
                    const { id, roadmapNodeId, createdAt, updatedAt, ...rest } = event;
                    calendarEventInserts.push({
                        ...rest,
                        userId: userId,
                        roadmapNodeId: insertedNode.id,
                        createdAt: createdAt,
                        updatedAt: updatedAt,
                    });
                }
            }
        }

        if (calendarEventInserts.length > 0) {
            const { calendarEvents } = await import("@/modules/calendar/db/schema");
            await tx.insert(calendarEvents).values(calendarEventInserts);
        }

        return {
            roadmap: createdRoadmap,
            insertedNodes: insertedRoadmapNodes,
        };
    });

    return {
        roadmapId: roadmap.id,
        totalNodes: responseNodes.length,
        nodes: responseNodes.map((node , index) => ({
            orderIndex: node.step,
            nodeId: insertedNodes[index]?.id,
            status: insertedNodes[index]?.status,
            curriculumTitle: node.curriculumTitle,
            skillName: node.skillName,
            priority: node.priority,
            completedAt: insertedNodes[index]?.completedAt,
        })),
        skillsMissingCurriculum,
    };
}

function getRoleSkillWeight(row: { isCore: boolean } & Record<string, unknown>) {
    return row.isCore ? 5 : 1;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
