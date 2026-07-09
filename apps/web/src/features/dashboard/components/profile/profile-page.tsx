import { authClient } from "@/lib/auth-client";
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
import { RoadmapProgressCard } from "./roadmap-progress-card";

export function ProfilePage() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const roleId = session?.user.roleId || null;

	const { data: skills, isLoading: isSkillsLoading } = useUserSkills();
	const { data: role, isLoading: isRoleLoading } = useRoleById(roleId);
	const { data: latestReport, isLoading: isReportLoading } = useLatestReport(roleId);
	const { data: globalLeaderboard, isLoading: isGlobalLoading } = useGlobalLeaderboard();
	const { data: roleLeaderboard, isLoading: isRoleLeaderboardLoading } = useRoleLeaderboard(roleId);
	const { data: activeRoadmap, isLoading: isRoadmapLoading } = useActiveRoadmap(roleId);

	if (isSessionPending) {
		return <Loader />;
	}

	if (!session?.user) {
		return <div>Not authenticated</div>;
	}

	const finalScore = Number(latestReport?.report?.overallReadinessScore ?? 0);
	const activityScore = Number(latestReport?.report?.generalGithubScore ?? 0);
	const tierInfo = getTierInfo(finalScore, activityScore);

	const isLoading = isSkillsLoading || isRoleLoading || isReportLoading || isGlobalLoading || isRoleLeaderboardLoading || isRoadmapLoading;

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
						projectsCount={0}
					/>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<SkillsOverview skills={skills ?? []} />
				<RoadmapProgressCard roadmap={activeRoadmap} isLoading={isRoadmapLoading} />
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
