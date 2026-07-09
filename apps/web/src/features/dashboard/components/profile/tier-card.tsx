import { Card, CardContent } from "@/components/ui/card";
import { TIER_COLORS, type TierInfo, type GamificationTier } from "./profile.types";
import { Crown, Diamond, Medal, Star, Trophy } from "lucide-react";

interface TierCardProps {
	tierInfo: TierInfo;
}

const TIER_ICONS: Record<GamificationTier, React.ComponentType<{ className?: string }>> = {
	Bronze: Medal,
	Silver: Star,
	Gold: Trophy,
	Diamond: Diamond,
	Master: Crown,
};

export function TierCard({ tierInfo }: TierCardProps) {
	const { tier, combinedScore, nextTier, progressToNext } = tierInfo;
	const colors = TIER_COLORS[tier];
	const Icon = TIER_ICONS[tier];

	return (
		<Card className={`overflow-hidden border-2 ${colors.border} ${colors.bg}`}>
			<CardContent className="p-6">
				<div className="flex flex-col items-center gap-4">
					<div className={`relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br ${colors.gradient} shadow-lg`}>
						<Icon className="size-12 text-white" />
						<div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-background shadow-md">
							<span className={`text-xs font-bold ${colors.text}`}>
								{Math.round(combinedScore)}
							</span>
						</div>
					</div>

					<div className="text-center">
						<h3 className={`text-2xl font-bold ${colors.text}`}>{tier}</h3>
						<p className="text-sm text-muted-foreground">
							{combinedScore.toFixed(1)} XP
						</p>
					</div>

					{nextTier && (
						<div className="w-full space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Progress to {nextTier}</span>
								<span className="font-medium tabular-nums">
									{Math.round(progressToNext)}%
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-muted">
								<div
									className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-700 ease-out`}
									style={{ width: `${progressToNext}%` }}
								/>
							</div>
						</div>
					)}

					{!nextTier && (
						<div className="text-center">
							<p className={`text-sm font-medium ${colors.text}`}>
								Maximum tier achieved!
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
