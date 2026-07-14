import {
    contributionPoints,
    type ContributionRepo,
} from "./contributionAggregator";
import { clamp, normalizeSkillName, type GitHubEvent, type GitHubRepo, type RepoLanguages } from "./utils";
import type { RepoDependencies } from "./utils";

const GIT_SIGNAL_EVENT_TYPES = new Set([
    "PushEvent",
    "PullRequestEvent",
    "PullRequestReviewEvent",
]);

export function calculateInferredSkillStrengths({
    contributions,
    events,
    repoLanguages,
    repos,
    repoDependencies,
    dbSkills,
}: {
    contributions: Map<string, ContributionRepo>;
    events: GitHubEvent[];
    repoLanguages: Map<string, RepoLanguages>;
    repos: GitHubRepo[];
    repoDependencies: RepoDependencies;
    dbSkills: Array<{ normalizedName: string, githubKeywords: string[] }>;
}) {
    const inferred = new Map<string, number>();

    const contributionsForScoring = [...contributions.values()];

    const totalContributionPoints = contributionsForScoring.reduce(
        (sum, contribution) => sum + contributionPoints(contribution),
        0
    );

    const gitEvents = events.filter((event) => {
        return GIT_SIGNAL_EVENT_TYPES.has(event.type);
    }).length;

    const activeReposCount = repos.length;

    if (totalContributionPoints > 0 || gitEvents > 0 || activeReposCount > 0) {
        const gitStrength = clamp(
            Math.log1p(totalContributionPoints) * 18 +
                Math.log1p(gitEvents) * 10 +
                Math.log1p(activeReposCount) * 12,
            8,
            100
        );

        inferred.set("git", gitStrength);
    }

    let sqlBytes = 0;
    let totalBytes = 0;

    for (const languages of repoLanguages.values()) {
        for (const [language, bytes] of Object.entries(languages)) {
            const normalizedBytes = Math.max(bytes, 0);

            totalBytes += normalizedBytes;

            if (normalizeSkillName(language) === "sql") {
                sqlBytes += normalizedBytes;
            }
        }
    }

    if (sqlBytes > 0 && totalBytes > 0) {
        const sqlShare = sqlBytes / totalBytes;

        const sqlStrength = clamp(sqlShare * 300 + Math.log1p(sqlBytes) * 2, 8, 100);

        inferred.set("sql", sqlStrength);
    }

    const metadataSqlScore = calculateSqlMetadataScore({
        repos,
        contributions,
    });

    if (metadataSqlScore > 0) {
        inferred.set("sql", Math.max(inferred.get("sql") ?? 0, metadataSqlScore));
    }

    const dependencySkills = calculateDependencySkills({
        repoDependencies,
        repos,
        contributions,
        dbSkills,
    });

    for (const [skillName, dependencyStrength] of dependencySkills) {
        inferred.set(
            skillName,
            Math.max(inferred.get(skillName) ?? 0, dependencyStrength)
        );
    }

    return inferred;
}

export function calculateDependencySkills({
    repoDependencies,
    repos,
    contributions,
    dbSkills,
}: {
    repoDependencies: RepoDependencies;
    repos: GitHubRepo[];
    contributions: Map<string, ContributionRepo>;
    dbSkills: Array<{ normalizedName: string, githubKeywords: string[] }>;
}) {
    const dependencyToSkill = new Map<string, string>();
    const dependencyPrefixToSkill: Array<{ prefix: string; skill: string }> = [];

    // Dynamically build mapping from database skills
    for (const skill of dbSkills) {
        if (!skill.githubKeywords || skill.githubKeywords.length === 0) continue;
        
        for (const keyword of skill.githubKeywords) {
            const trimmedKeyword = keyword.trim().toLowerCase();
            if (trimmedKeyword.endsWith("/")) {
                // If the keyword ends with a slash, treat it as a prefix (e.g. "@aws-sdk/")
                dependencyPrefixToSkill.push({ prefix: trimmedKeyword, skill: skill.normalizedName });
            } else {
                dependencyToSkill.set(trimmedKeyword, skill.normalizedName);
            }
        }
    }


    const rawScores = new Map<string, number>();
    const repoByName = new Map(repos.map((r) => [r.full_name, r]));

    for (const [repoName, dependencyList] of repoDependencies.entries()) {
        const repo = repoByName.get(repoName);
        const contribution = contributions.get(repoName);

        // Calculate a weight for this repository based on its complexity and popularity
        let repoWeight = 1;
        
        if (contribution) {
            const complexityScore = clamp(Math.log1p(contributionPoints(contribution)) * 22, 0, 100);
            repoWeight += (complexityScore / 10);
        }
        
        if (repo && !repo.fork) {
            repoWeight += Math.log1p(repo.stargazers_count ?? 0) * 0.5;
        }

        const uniqueDependencies = new Set(
            dependencyList.map((dependency) => dependency.trim().toLowerCase())
        );

        for (const dependencyName of uniqueDependencies) {
            const mappedSkill =
                dependencyToSkill.get(dependencyName) ??
                dependencyPrefixToSkill.find((entry) =>
                    dependencyName.startsWith(entry.prefix)
                )?.skill;

            if (!mappedSkill) continue;

            const normalizedSkill = normalizeSkillName(mappedSkill);
            rawScores.set(normalizedSkill, (rawScores.get(normalizedSkill) ?? 0) + repoWeight);
        }
    }

    const strengths = new Map<string, number>();

    for (const [skillName, score] of rawScores) {
        strengths.set(skillName, clamp(Math.log1p(score) * 28, 8, 100));
    }

    return strengths;
}

export function calculateSqlMetadataScore({
    repos,
    contributions,
}: {
    repos: GitHubRepo[];
    contributions: Map<string, ContributionRepo>;
}) {
    const sqlKeywords = [
        "sql",
        "postgres",
        "postgresql",
        "mysql",
        "mariadb",
        "sqlite",
        "mssql",
        "t-sql",
        "plpgsql",
        "prisma",
        "drizzle",
        "sequelize",
        "typeorm",
        "knex",
        "supabase",
        "planetscale",
        "cockroachdb",
        "neon",
        "hasura",
    ];

    const dbTechKeywords = new Set([
        "prisma",
        "drizzle",
        "sequelize",
        "typeorm",
        "knex",
        "supabase",
        "planetscale",
        "cockroachdb",
        "neon",
        "hasura",
    ]);

    const hasKeywordToken = (value: string, keyword: string) => {
        return value.includes(keyword);
    };

    let evidenceScore = 0;

    for (const repo of repos) {
        const contribution = contributions.get(repo.full_name);

        const contributionWeight = contribution
            ? clamp(Math.log1p(contributionPoints(contribution)) + 1, 1, 4)
            : 1;

        const repoNameText =
            (repo.name ?? repo.full_name)
                .trim()
                .toLowerCase();

        const descriptionText =
            (repo.description ?? "")
                .trim()
                .toLowerCase();

        const topicText = (repo.topics ?? []).join(" ").trim().toLowerCase();

        for (const keyword of sqlKeywords) {
            const keywordBaseWeight = dbTechKeywords.has(keyword) ? 1.8 : 1.2;

            if (hasKeywordToken(repoNameText, keyword)) {
                evidenceScore += keywordBaseWeight * 1.5 * contributionWeight;
            }

            if (hasKeywordToken(descriptionText, keyword)) {
                evidenceScore += keywordBaseWeight * 1.1 * contributionWeight;
            }

            if (hasKeywordToken(topicText, keyword)) {
                evidenceScore += keywordBaseWeight * 1.7 * contributionWeight;
            }
        }
    }

    return evidenceScore > 0 ? clamp(Math.log1p(evidenceScore) * 16, 8, 75) : 0;
}
