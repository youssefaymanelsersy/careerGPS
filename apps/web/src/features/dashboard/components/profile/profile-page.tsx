import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/composites/loader";
import {
	useUserSkills,
	useRoleById,
	useLatestReport,
	useGlobalLeaderboard,
	useRoleLeaderboard,
	useActiveRoadmap,
} from "./profile.service";
import { getTierInfo } from "./profile.types";
import { ProfileHero } from "./profile-hero";
import { TierCard } from "./tier-card";
import { ProfileStats } from "./profile-stats";
import { SkillsOverview } from "./skills-overview";
import { LeaderboardSection } from "./leaderboard-section";
import { RoleSelectorCard } from "./role-selector-card";
import { RoadmapProgressCard } from "./roadmap-progress-card";
import { ProfilePageSkeleton } from "./profile-page-skeleton";
import { DataSyncCard } from "./data-sync-card";

export function ProfilePage() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const roleId = session?.user.roleId || null;

	const { data: skills, isLoading: isSkillsLoading } = useUserSkills();
	const { data: role, isLoading: isRoleLoading } = useRoleById(roleId);
	const { data: latestReport, isLoading: isReportLoading } = useLatestReport(roleId);
	const { data: globalLeaderboard, isLoading: isGlobalLoading } = useGlobalLeaderboard();
	const { data: roleLeaderboard, isLoading: isRoleLeaderboardLoading } = useRoleLeaderboard(roleId);
	const { data: activeRoadmap, isLoading: isRoadmapLoading } = useActiveRoadmap(roleId);
	const { data: githubStats, isLoading: isGithubStatsLoading } = useQuery(trpc.github.getStats.queryOptions());
	const { data: projects, isLoading: isProjectsLoading } = useQuery(trpc.github.getProjects.queryOptions());

	if (isSessionPending) {
		return <Loader />;
	}

	const isLoading = isSkillsLoading || isRoleLoading || isReportLoading || isGlobalLoading || isRoleLeaderboardLoading || isRoadmapLoading || isGithubStatsLoading || isProjectsLoading;

	if (isLoading) {
		return <ProfilePageSkeleton />;
	}

	if (!session?.user) {
		return <div>Not authenticated</div>;
	}
	
	const finalScore = Number(latestReport?.report?.overallReadinessScore ?? 0);
	const activityScore = Number(githubStats?.activityScore ?? 0);
	const tierInfo = getTierInfo(finalScore, activityScore);

	return (
		<div className="space-y-6">
			<ProfileHero
				user={session.user}
				roleTitle={role?.title ?? null}
				finalScore={finalScore}
				activityScore={activityScore}
			/>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<TierCard tierInfo={tierInfo} />
				</div>
				<div className="lg:col-span-2">
					<ProfileStats
						readinessScore={finalScore}
						activityScore={activityScore}
						skillsCount={skills?.length ?? 0}
						projectsCount={projects?.length ?? 0}
					/>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-6">
					<SkillsOverview skills={skills ?? []} />
					<RoleSelectorCard currentRoleId={roleId} />
				</div>
				<div className="space-y-6">
					<RoadmapProgressCard roadmap={activeRoadmap} isLoading={isRoadmapLoading} />
					<DataSyncCard />
				</div>
			</div>

			<LeaderboardSection
				globalLeaderboard={globalLeaderboard}
				roleLeaderboard={roleLeaderboard}
				roleTitle={role?.title ?? null}
				currentUserId={session.user.id}
				isLoading={isGlobalLoading || isRoleLeaderboardLoading}
			/>
		</div>
	);
}
