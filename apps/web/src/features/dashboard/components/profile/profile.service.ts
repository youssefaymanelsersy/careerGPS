import { trpc } from "@/utils/trpc";
import type { RouterOutput } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

type SkillsData = RouterOutput["skills"]["getUserSkills"];
type RoleData = RouterOutput["roles"]["getRoleById"];
type LatestReportData = RouterOutput["readiness"]["getLatestReport"];
type GlobalLeaderboardData = RouterOutput["readiness"]["getGlobalLeaderboard"];
type RoleLeaderboardData = RouterOutput["readiness"]["getRoleLeaderboard"];
type ActiveRoadmapData = RouterOutput["roadmap"]["getActiveRoadmap"];

export function useUserSkills() {
	return useQuery<SkillsData>({
		...trpc.skills.getUserSkills.queryOptions(),
	});
}

export function useAllRoles(includeScore: boolean) {
	return useQuery({
		...trpc.roles.getAllRoles.queryOptions({ includeScore }),
	});
}

export function useRoleById(roleId: string | null) {
	return useQuery<RoleData>({
		...trpc.roles.getRoleById.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
	});
}

export function useLatestReport(roleId: string | null) {
	return useQuery<LatestReportData>({
		...trpc.readiness.getLatestReport.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
	});
}

export function useGlobalLeaderboard(limit = 10) {
	return useQuery<GlobalLeaderboardData>({
		...trpc.readiness.getGlobalLeaderboard.queryOptions({ limit }),
	});
}

export function useRoleLeaderboard(roleId: string | null, limit = 10) {
	return useQuery<RoleLeaderboardData>({
		...trpc.readiness.getRoleLeaderboard.queryOptions({ roleId: roleId!, limit }),
		enabled: !!roleId,
	});
}

export function useActiveRoadmap(roleId: string | null) {
	return useQuery<ActiveRoadmapData>({
		...trpc.roadmap.getActiveRoadmap.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
		retry: false,
	});
}
