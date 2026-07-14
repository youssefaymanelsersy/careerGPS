import { clamp } from "./utils";
import type { GitHubEvent } from "./utils";
import type { GitHubGraphqlContributionStats } from "./utils";

export type ContributionRepo = {
    repoName: string;
    lastActivityAt: string;
    pushEvents: number;
    pushedCommits: number;
    pullRequestsOpened: number;
    pullRequestsMerged: number;
    pullRequestReviews: number;
    issuesOpened: number;
    issueComments: number;
};

export function aggregateContributions(events: GitHubEvent[]) {
    const repoMap = new Map<string, ContributionRepo>();

    for (const event of events) {
        const repoName = event.repo?.name;
        if (!repoName) continue;

        const existing =
            repoMap.get(repoName) ??
            ({
                repoName,
                lastActivityAt: event.created_at,
                pushEvents: 0,
                pushedCommits: 0,
                pullRequestsOpened: 0,
                pullRequestsMerged: 0,
                pullRequestReviews: 0,
                issuesOpened: 0,
                issueComments: 0,
            } as ContributionRepo);

        const eventTime = Date.parse(event.created_at);
        const lastTime = Date.parse(existing.lastActivityAt);

        if (
            Number.isFinite(eventTime) &&
            (!Number.isFinite(lastTime) || eventTime > lastTime)
        ) {
            existing.lastActivityAt = event.created_at;
        }

        if (event.type === "PushEvent") {
            existing.pushEvents++;
            existing.pushedCommits += event.payload?.commits?.length ?? 0;
        }

        if (event.type === "PullRequestEvent") {
            existing.pullRequestsOpened++;
            if (event.payload?.pull_request?.merged) existing.pullRequestsMerged++;
        }

        if (event.type === "PullRequestReviewEvent") {
            existing.pullRequestReviews++;
        }

        if (event.type === "IssuesEvent" && event.payload?.action === "opened") {
            existing.issuesOpened++;
        }

        if (event.type === "IssueCommentEvent") {
            existing.issueComments++;
        }

        repoMap.set(repoName, existing);
    }

    return repoMap;
}

export function contributionPoints(c: ContributionRepo) {
    return (
        c.pushedCommits * 0.6 +
        c.pushEvents * 0.8 +
        c.pullRequestsOpened * 4 +
        c.pullRequestsMerged * 10 +
        c.pullRequestReviews * 4 +
        c.issuesOpened * 2 +
        c.issueComments * 1
    );
}

export function calculateContributionComplexity(c: ContributionRepo) {
    return clamp(Math.log1p(contributionPoints(c)) * 22, 0, 100);
}

export function mergeGraphqlContributionStats({
    baseContributions,
    stats,
}: {
    baseContributions: Map<string, ContributionRepo>;
    stats: GitHubGraphqlContributionStats;
}) {
    const merged = new Map<string, ContributionRepo>(baseContributions);

    const nowIso = new Date().toISOString();

    for (const repoStats of stats.repoCommitBreakdown) {
        const existing = merged.get(repoStats.repoName) ?? {
            repoName: repoStats.repoName,
            lastActivityAt: nowIso,
            pushEvents: 0,
            pushedCommits: 0,
            pullRequestsOpened: 0,
            pullRequestsMerged: 0,
            pullRequestReviews: 0,
            issuesOpened: 0,
            issueComments: 0,
        };

        existing.pushedCommits = Math.max(existing.pushedCommits, repoStats.commitCount);
        merged.set(repoStats.repoName, existing);
    }

    const targetRepoNames =
        stats.repoCommitBreakdown.length > 0
            ? stats.repoCommitBreakdown.map((repo) => repo.repoName)
            : [...merged.keys()];

    return merged;
}
