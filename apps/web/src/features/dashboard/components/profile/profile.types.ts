import type { RouterOutput } from "@/utils/trpc";

export type UserSkills = RouterOutput["skills"]["getUserSkills"];
export type AllRoles = RouterOutput["roles"]["getAllRoles"];
export type ActiveRoadmap = RouterOutput["roadmap"]["getActiveRoadmap"];
export type LatestReport = RouterOutput["readiness"]["getLatestReport"];
export type GlobalLeaderboard = RouterOutput["readiness"]["getGlobalLeaderboard"];
export type RoleLeaderboard = RouterOutput["readiness"]["getRoleLeaderboard"];

export type GamificationTier = "Bronze" | "Silver" | "Gold" | "Diamond" | "Master";

export interface TierInfo {
	tier: GamificationTier;
	combinedScore: number;
	nextTier: GamificationTier | null;
	nextTierThreshold: number;
	progressToNext: number;
}

export const TIER_THRESHOLDS: Record<GamificationTier, number> = {
	Bronze: 0,
	Silver: 35,
	Gold: 55,
	Diamond: 75,
	Master: 90,
};

export const TIER_ORDER: GamificationTier[] = ["Bronze", "Silver", "Gold", "Diamond", "Master"];

export function calculateTier(finalScore: number, activityScore: number): GamificationTier {
	const combinedRankScore = finalScore * 0.7 + activityScore * 0.3;
	if (combinedRankScore >= 90) return "Master";
	if (combinedRankScore >= 75) return "Diamond";
	if (combinedRankScore >= 55) return "Gold";
	if (combinedRankScore >= 35) return "Silver";
	return "Bronze";
}

export function getTierInfo(finalScore: number, activityScore: number): TierInfo {
	const combinedScore = finalScore * 0.7 + activityScore * 0.3;
	const tier = calculateTier(finalScore, activityScore);
	const currentIndex = TIER_ORDER.indexOf(tier);
	const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;
	const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : 100;
	const currentThreshold = TIER_THRESHOLDS[tier];
	const progressToNext = nextTier
		? Math.min(100, ((combinedScore - currentThreshold) / (nextTierThreshold - currentThreshold)) * 100)
		: 100;

	return { tier, combinedScore, nextTier, nextTierThreshold, progressToNext };
}

export const TIER_COLORS: Record<GamificationTier, { bg: string; text: string; border: string; gradient: string }> = {
	Bronze: {
		bg: "bg-amber-50 dark:bg-amber-950/30",
		text: "text-amber-700 dark:text-amber-400",
		border: "border-amber-200 dark:border-amber-800",
		gradient: "from-amber-500 to-amber-700",
	},
	Silver: {
		bg: "bg-zinc-50 dark:bg-zinc-800/30",
		text: "text-zinc-600 dark:text-zinc-300",
		border: "border-zinc-300 dark:border-zinc-600",
		gradient: "from-zinc-400 to-zinc-600",
	},
	Gold: {
		bg: "bg-yellow-50 dark:bg-yellow-950/30",
		text: "text-yellow-600 dark:text-yellow-400",
		border: "border-yellow-300 dark:border-yellow-700",
		gradient: "from-yellow-400 to-yellow-600",
	},
	Diamond: {
		bg: "bg-cyan-50 dark:bg-cyan-950/30",
		text: "text-cyan-600 dark:text-cyan-400",
		border: "border-cyan-300 dark:border-cyan-700",
		gradient: "from-cyan-400 to-cyan-600",
	},
	Master: {
		bg: "bg-purple-50 dark:bg-purple-950/30",
		text: "text-purple-600 dark:text-purple-400",
		border: "border-purple-300 dark:border-purple-700",
		gradient: "from-purple-500 to-purple-700",
	},
};
