import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TIER_COLORS, calculateTier, type GamificationTier, type GlobalLeaderboard, type RoleLeaderboard } from "./profile.types";
import { Crown, Diamond, Globe, Medal, Star, Trophy, Users } from "lucide-react";

type LeaderboardEntry = { userId: string; name: string; image: string; roleId: string; finalScore: number; activityScore: number; tier: "Bronze" | "Silver" | "Gold" | "Diamond" | "Master" };

interface LeaderboardSectionProps {
	globalLeaderboard: GlobalLeaderboard | undefined;
	roleLeaderboard: RoleLeaderboard | undefined;
	roleTitle: string | null | undefined;
	currentUserId: string;
	isLoading: boolean;
}

const TIER_ICONS: Record<GamificationTier, React.ComponentType<{ className?: string }>> = {
	Bronze: Medal,
	Silver: Star,
	Gold: Trophy,
	Diamond: Diamond,
	Master: Crown,
};

interface LeaderboardTableProps {
	entries: GlobalLeaderboard | RoleLeaderboard | undefined;
	currentUserId: string;
}

function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
	if (!entries || entries.length === 0) {
		return (
			<div className="py-8 text-center">
				<Users className="mx-auto size-12 text-muted-foreground/50" />
				<p className="mt-2 text-sm text-muted-foreground">No entries yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{entries.map((entry: LeaderboardEntry, index: number) => {
				const rank = index + 1;
				const colors = TIER_COLORS[entry.tier];
				const TierIcon = TIER_ICONS[entry.tier];
				const isCurrentUser = entry.userId === currentUserId;
				const initials = entry.name
					.split(" ")
					.map((n: string) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2);

				return (
					<div
						key={entry.userId}
						className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
							isCurrentUser
								? "border-primary bg-primary/5 shadow-sm"
								: "border-transparent bg-surface hover:bg-surface/80"
						}`}
					>
						<div className="flex size-8 items-center justify-center rounded-lg bg-muted font-bold text-sm tabular-nums">
							{rank}
						</div>
						<Avatar className="size-9">
							<AvatarImage src={entry.image || undefined} alt={entry.name} />
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="font-medium truncate">
								{entry.name}
								{isCurrentUser && (
									<span className="ms-2 text-xs text-primary">(You)</span>
								)}
							</p>
						</div>
						<Badge variant="default" className={colors.text}>
							<TierIcon className="size-3" />
							{entry.tier}
						</Badge>
						<div className="text-right">
							<p className="font-bold tabular-nums">{Math.round(entry.finalScore)}</p>
							<p className="text-xs text-muted-foreground">score</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function LeaderboardSection({
	globalLeaderboard,
	roleLeaderboard,
	roleTitle,
	currentUserId,
	isLoading,
}: LeaderboardSectionProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="size-5" />
						Leaderboard
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-8 w-40" />
					{[1, 2, 3, 4, 5].map((i) => (
						<Skeleton key={i} className="h-14 rounded-xl" />
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="size-5" />
					Leaderboard
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="global">
					<TabsList variant="default">
						<TabsTrigger value="global">
							<Globe className="size-4" />
							Global
						</TabsTrigger>
						<TabsTrigger value="role" disabled={!roleTitle}>
							<Users className="size-4" />
							{roleTitle || "Role"}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="global">
						<LeaderboardTable entries={globalLeaderboard} currentUserId={currentUserId} />
					</TabsContent>
					<TabsContent value="role">
						<LeaderboardTable entries={roleLeaderboard} currentUserId={currentUserId} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
