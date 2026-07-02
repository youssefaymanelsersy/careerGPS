import { TRPCError } from "@trpc/server";
import { and, eq, sql, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
    projects,
    projectSkills,
    githubStats,
    skills,
    userSkills,
    user,
} from "@/db/schema";
import {
    aggregateContributions,
    calculateContributionComplexity,
    mergeGraphqlContributionStats,
    contributionPoints,
    type ContributionRepo,
} from "../github/contributionAggregator";
import {
    fetchGithubEvents,
    fetchGithubRepos,
    fetchRepoDependencies,
    fetchRepoLanguageBreakdowns,
} from "../github/githubClient";
import { fetchGithubContributionStats } from "../github/githubGraphqlClient.js";
import {
    calculateCategorizedLanguageStrengths,
    extractRepoSkillNames,
    getSkillCategory,
    selectRepoNamesForLanguageAnalysis,
} from "../github/languageAnalyzer";
import {
    calculateDependencySkills,
    calculateInferredSkillStrengths,
} from "../github/skillInference";
import { calculateActivityScore } from "../github/activityScore";
import {
    clamp,
    getGithubHeaders,
    normalizeSkillName,
    type GitHubRepo,
} from "../github/utils";

export async function buildUserSkillMap({
    githubUsername,
}: {
    userId: string;
    githubUsername: string;
}) {
    const headers = getGithubHeaders();

    const graphqlStats = await fetchGithubContributionStats({
        username: githubUsername,
        headers,
    });

    if (process.env.GITHUB_DEBUG_GRAPHQL === "1") {
        console.log("GraphQL contribution stats:", graphqlStats);
    }

    const events = await fetchGithubEvents({ username: githubUsername, headers });
    const repos = await fetchGithubRepos({ username: githubUsername, headers });

    const eventContributions = aggregateContributions(events);

    const contributions = graphqlStats
        ? mergeGraphqlContributionStats({
            baseContributions: eventContributions,
            stats: graphqlStats,
        })
        : eventContributions;

    const repoNames = selectRepoNamesForLanguageAnalysis({
        repos,
        contributions,
    });

    const repoLanguages = await fetchRepoLanguageBreakdowns({
        repoNames,
        headers,
    });

    const { combinedSkillStrengths: categorizedSkillStrengths } =
        calculateCategorizedLanguageStrengths({
            contributions,
            repoLanguages,
            repos,
        });

    const dependencyRepoNames = selectTopRepoNamesForDependencyAnalysis({
        repos,
        contributions,
        maxRepos: 10,
    });

    const repoDependencies = await fetchRepoDependencies({
        repoNames: dependencyRepoNames,
        headers,
    });

    const dependencySkills = calculateDependencySkills({
        repoDependencies,
        repos,
        contributions,
    });

    if (process.env.GITHUB_DEBUG_GRAPHQL === "1") {
        console.log("Detected repo dependencies:", repoDependencies);
        console.log("Derived dependency skills:", dependencySkills);
    }

    const inferredSkillStrengths = calculateInferredSkillStrengths({
        contributions,
        events,
        repoLanguages,
        repos,
        repoDependencies,
    });

    const combinedSkillStrengths = new Map(categorizedSkillStrengths);

    for (const [skill, strength] of inferredSkillStrengths) {
        combinedSkillStrengths.set(
            skill,
            Math.max(combinedSkillStrengths.get(skill) ?? 0, strength)
        );
    }

    if (process.env.GITHUB_DEBUG_GRAPHQL === "1") {
        const categorizedSkills = categorizeSkills(combinedSkillStrengths);

        console.log("Final skill categories:", categorizedSkills);
    }

    const activityScore = calculateActivityScore({
        contributions,
        events,
        repos,
    });

    return {
        headers,
        graphqlStats,
        events,
        repos,
        contributions,
        repoLanguages,
        repoDependencies,
        dependencySkills,
        inferredSkillStrengths,
        combinedSkillStrengths,
        activityScore,
    };
}

export async function syncGithubSkillsForUser({
    userId,
    githubUsername,
}: {
    userId: string;
    githubUsername: string;
}) {
    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
    });

    if (!existingUser) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `User ${userId} not found.`,
        });
    }

    const skillMapData = await buildUserSkillMap({
        userId,
        githubUsername,
    });

    const {
        repos,
        contributions,
        repoLanguages,
        combinedSkillStrengths,
        activityScore,
    } = skillMapData;

    return await db.transaction(async (tx) => {
        const allExtractedSkillNames = new Set<string>();
        for (const skillName of combinedSkillStrengths.keys()) {
            allExtractedSkillNames.add(normalizeSkillName(skillName));
        }
        for (const repoName of repoLanguages.keys()) {
            const names = extractRepoSkillNames(repoLanguages.get(repoName));
            for (const name of names) {
                allExtractedSkillNames.add(normalizeSkillName(name));
            }
        }

        const requiredSkillNames = Array.from(allExtractedSkillNames);

        const existingSkills = requiredSkillNames.length > 0 
            ? await tx.select().from(skills).where(inArray(skills.name, requiredSkillNames)) 
            : [];

        let skillsByNormalizedName = new Map<string, Array<(typeof existingSkills)[number]>>();
        
        for (const skill of existingSkills) {
            const key = normalizeSkillName(skill.name);
            const bucket = skillsByNormalizedName.get(key) ?? [];
            bucket.push(skill);
            skillsByNormalizedName.set(key, bucket);
        }

        const missingNormalizedSkillNames = requiredSkillNames.filter(
            (normalizedName) => !skillsByNormalizedName.has(normalizedName)
        );

        if (missingNormalizedSkillNames.length > 0) {
            const newSkillsData = missingNormalizedSkillNames.map((name) => ({
                name,
                hasNoDependencies: true,
            }));
            
            await tx.insert(skills).values(newSkillsData).onConflictDoNothing();

            const refreshedSkills = await tx.select().from(skills)
                .where(inArray(skills.name, missingNormalizedSkillNames));

            for (const skill of refreshedSkills) {
                const key = normalizeSkillName(skill.name);
                const bucket = skillsByNormalizedName.get(key) ?? [];
                bucket.push(skill);
                skillsByNormalizedName.set(key, bucket);
            }
        }

        const projectValues = [];
        for (const contribution of contributions.values()) {
            projectValues.push({
                userId,
                title: contribution.repoName,
                description: "",
                source: "github",
                complexityScore: calculateContributionComplexity(contribution),
            });
        }

        let upsertedProjects: { id: string; title: string }[] = [];
        if (projectValues.length > 0) {
            upsertedProjects = await tx
                .insert(projects)
                .values(projectValues)
                .onConflictDoUpdate({
                    target: [projects.userId, projects.title],
                    set: { complexityScore: sql`EXCLUDED.complexity_score` },
                })
                .returning();
        }

        const projectSkillsToInsert = [];
        for (const project of upsertedProjects) {
            const repoSkillNames = extractRepoSkillNames(repoLanguages.get(project.title));

            for (const name of repoSkillNames) {
                const normalized = normalizeSkillName(name);
                const matchedSkills = skillsByNormalizedName.get(normalized) ?? [];

                for (const skill of matchedSkills) {
                    projectSkillsToInsert.push({
                        projectId: project.id,
                        skillId: skill.id,
                    });
                }
            }
        }

        if (projectSkillsToInsert.length > 0) {
            await tx.insert(projectSkills).values(projectSkillsToInsert).onConflictDoNothing();
        }

        const existingUserSkills = await tx.query.userSkills.findMany({
            where: eq(userSkills.userId, userId),
        });

        const existingStrengthMap = new Map(
            existingUserSkills.map(s => [s.skillId, Number(s.strengthScore)])
        );

        const userSkillsToUpsert = [];
        for (const [skillName, strength] of combinedSkillStrengths) {
            const normalized = normalizeSkillName(skillName);
            const matchedSkills = skillsByNormalizedName.get(normalized) ?? [];

            for (const skill of matchedSkills) {
                const githubStrength = Number(strength.toFixed(2));
                const existingStrength = existingStrengthMap.get(skill.id) ?? 0;
                const mergedStrength = Math.max(existingStrength, githubStrength);

                userSkillsToUpsert.push({
                    userId,
                    skillId: skill.id,
                    strengthScore: mergedStrength.toFixed(2),
                });
            }
        }

        if (userSkillsToUpsert.length > 0) {
            await tx
                .insert(userSkills)
                .values(userSkillsToUpsert)
                .onConflictDoUpdate({
                    target: [userSkills.userId, userSkills.skillId],
                    set: { strengthScore: sql`EXCLUDED.strength_score` },
                });
        }

        const totalStars = repos.reduce(
            (sum, repo) => sum + (repo.stargazers_count ?? 0),
            0
        );

        const reposCount = Math.max(repos.length, contributions.size);

        await tx
            .insert(githubStats)
            .values({
                userId,
                username: githubUsername,
                reposCount,
                totalStars,
                activityScore: activityScore.toString(),
            })
            .onConflictDoUpdate({
                target: githubStats.userId,
                set: {
                    reposCount,
                    totalStars,
                    activityScore: activityScore.toString(),
                },
            });

        return {
            repoCount: reposCount,
            activityScore,
        };
    });
}

function selectTopRepoNamesForDependencyAnalysis({
    repos,
    contributions,
    maxRepos,
}: {
    repos: GitHubRepo[];
    contributions: Map<string, ContributionRepo>;
    maxRepos: number;
}) {
    const now = Date.now();
    const repoByName = new Map(repos.map(r => [r.full_name, r]));
    const allRepoNames = new Set([...repoByName.keys(), ...contributions.keys()]);

    const scoredRepos = [...allRepoNames].map((repoName) => {
        const repo = repoByName.get(repoName);
        const contribution = contributions.get(repoName);
        
        const rawPoints = contribution ? contributionPoints(contribution) : 0;
        const isOwned = repo && !repo.fork;
        
        if (!isOwned && rawPoints < 5) {
            return { repoName, score: -1 };
        }

        const contributionScore = contribution
            ? Math.log1p(rawPoints) * 18
            : 0;

        const lastPushedAt = Date.parse(
            repo?.pushed_at ?? contribution?.lastActivityAt ?? ""
        );
        const recencyScore = Number.isFinite(lastPushedAt)
            ? clamp(30 - (now - lastPushedAt) / 86400000, 0, 30)
            : 0;

        return {
            repoName,
            score: contributionScore + recencyScore,
        };
    });

    return scoredRepos
        .filter(entry => entry.score >= 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, Math.max(0, maxRepos))
        .map((entry) => entry.repoName);
}

function categorizeSkills(skillMap: Map<string, number>) {
    const categorized = {
        languages: new Map<string, number>(),
        databases: new Map<string, number>(),
        frameworks: new Map<string, number>(),
        devops: new Map<string, number>(),
    };

    for (const [skillName, strength] of skillMap) {
        const normalizedSkill = normalizeSkillName(skillName);
        const category = getSkillCategory(normalizedSkill);

        if (!category) continue;

        categorized[category].set(normalizedSkill, strength);
    }

    return categorized;
}

export async function addManualSkill({
    userId,
    skillName,
    level,
}: {
    userId: string;
    skillName: string;
    level: "beginner" | "intermediate" | "expert";
}) {
    const normalizedName = normalizeSkillName(skillName);
    
    // Find skill in our db
    const skill = await db.query.skills.findFirst({
        where: eq(skills.name, normalizedName)
    });
    
    if (!skill) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Skill "${skillName}" not found in our database.`
        });
    }
    
    let baseScore = 30; // beginner
    if (level === "intermediate") baseScore = 60;
    else if (level === "expert") baseScore = 90;
    
    const existingUserSkill = await db.query.userSkills.findFirst({
        where: and(
            eq(userSkills.userId, userId),
            eq(userSkills.skillId, skill.id)
        ),
    });

    const existingStrength = existingUserSkill
        ? Number(existingUserSkill.strengthScore)
        : 0;

    // Update if the manual score is higher
    const newStrength = Math.max(existingStrength, baseScore);

    await db
        .insert(userSkills)
        .values({
            userId,
            skillId: skill.id,
            strengthScore: newStrength.toString(),
        })
        .onConflictDoUpdate({
            target: [userSkills.userId, userSkills.skillId],
            set: { strengthScore: newStrength.toString() },
        });
        
    return {
        skillId: skill.id,
        skillName: skill.name,
        level,
        strengthScore: newStrength
    };
}

export async function bulkAddManualSkills({
    userId,
    skillsList,
}: {
    userId: string;
    skillsList: Array<{ name: string; level: "beginner" | "intermediate" | "expert" }>;
}) {
    const allSkills = await db.select().from(skills);

    let skillsByNormalizedName = new Map<
        string,
        Array<(typeof allSkills)[number]>
    >();

    for (const skill of allSkills) {
        const key = normalizeSkillName(skill.name);
        const bucket = skillsByNormalizedName.get(key) ?? [];
        bucket.push(skill);
        skillsByNormalizedName.set(key, bucket);
    }

    const uniqueInput = new Map<string, "beginner" | "intermediate" | "expert">();
    for (const s of skillsList) {
        uniqueInput.set(normalizeSkillName(s.name), s.level);
    }

    const missingNormalizedSkillNames = [...uniqueInput.keys()].filter(
        (normalizedName) => !skillsByNormalizedName.has(normalizedName)
    );

    if (missingNormalizedSkillNames.length > 0) {
        await db
            .insert(skills)
            .values(
                missingNormalizedSkillNames.map((name) => ({
                    name,
                    hasNoDependencies: true,
                }))
            )
            .onConflictDoNothing();

        const refreshedSkills = await db.select().from(skills);
        skillsByNormalizedName = new Map();

        for (const skill of refreshedSkills) {
            const key = normalizeSkillName(skill.name);
            const bucket = skillsByNormalizedName.get(key) ?? [];
            bucket.push(skill);
            skillsByNormalizedName.set(key, bucket);
        }
    }

    const levelScores = {
        beginner: 30,
        intermediate: 60,
        expert: 90,
    };

    const existingUserSkills = await db.query.userSkills.findMany({
        where: eq(userSkills.userId, userId),
    });

    const existingStrengthMap = new Map(
        existingUserSkills.map(s => [s.skillId, Number(s.strengthScore)])
    );

    for (const [normalizedName, level] of uniqueInput) {
        const matchedSkills = skillsByNormalizedName.get(normalizedName) ?? [];
        const baseScore = levelScores[level] ?? 30;

        for (const skill of matchedSkills) {
            const existingStrength = existingStrengthMap.get(skill.id) ?? 0;
            const newStrength = Math.max(existingStrength, baseScore);

            await db
                .insert(userSkills)
                .values({
                    userId,
                    skillId: skill.id,
                    strengthScore: newStrength.toString(),
                })
                .onConflictDoUpdate({
                    target: [userSkills.userId, userSkills.skillId],
                    set: { strengthScore: newStrength.toString() },
                });
        }
    }

    return { success: true };
}
