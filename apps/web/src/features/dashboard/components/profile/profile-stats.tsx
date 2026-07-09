import { Card, CardContent } from "@/components/ui/card";
import { Target, Zap, Code, TrendingUp } from "lucide-react";

interface ProfileStatsProps {
	readinessScore: number;
	activityScore: number;
	skillsCount: number;
	projectsCount: number;
}

interface StatCardProps {
	label: string;
	value: number | string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
						<Icon className="size-5 text-white" />
					</div>
					<div>
						<p className="text-2xl font-bold tabular-nums">{value}</p>
						<p className="text-xs text-muted-foreground">{label}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function ProfileStats({ readinessScore, activityScore, skillsCount, projectsCount }: ProfileStatsProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 h-full">
			<StatCard
				label="Readiness Score"
				value={Math.round(readinessScore)}
				icon={Target}
				color="bg-gradient-to-br from-blue-500 to-blue-600"
			/>
			<StatCard
				label="Activity Score"
				value={Math.round(activityScore)}
				icon={Zap}
				color="bg-gradient-to-br from-amber-500 to-amber-600"
			/>
			<StatCard
				label="Skills Mastered"
				value={skillsCount}
				icon={Code}
				color="bg-gradient-to-br from-emerald-500 to-emerald-600"
			/>
			<StatCard
				label="Projects"
				value={projectsCount}
				icon={TrendingUp}
				color="bg-gradient-to-br from-purple-500 to-purple-600"
			/>
		</div>
	);
}
