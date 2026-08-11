import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function useUserSkills() {
	return useQuery({
		...trpc.skills.getUserSkills.queryOptions(),
	});
}

export function useAllRoles(includeScore: boolean) {
	return useQuery({
		...trpc.roles.getAllRoles.queryOptions({ includeScore }),
	});
}

export function useRoleById(roleId: string | null) {
	return useQuery({
		...trpc.roles.getRoleById.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
	});
}

export function useLatestReport(roleId: string | null) {
	return useQuery({
		...trpc.readiness.getLatestReport.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
	});
}

export function useGlobalLeaderboard(limit = 10) {
	return useQuery({
		...trpc.readiness.getGlobalLeaderboard.queryOptions({ limit }),
	});
}

export function useRoleLeaderboard(roleId: string | null, limit = 10) {
	return useQuery({
		...trpc.readiness.getRoleLeaderboard.queryOptions({ roleId: roleId!, limit }),
		enabled: !!roleId,
	});
}

export function useActiveRoadmap(roleId: string | null) {
	return useQuery({
		...trpc.roadmap.getActiveRoadmap.queryOptions({ roleId: roleId! }),
		enabled: !!roleId,
		retry: false,
	});
}
