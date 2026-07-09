import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scoreTier, scoreBgClass } from "@/features/dashboard/utils";
import type { ActiveRoadmap } from "./profile.types";
import { Map, CheckCircle, Clock, Lock } from "lucide-react";

type RoadmapNode = NonNullable<ActiveRoadmap["nodes"]>[number];

interface RoadmapProgressCardProps {
	roadmap: ActiveRoadmap | undefined;
	isLoading: boolean;
}

export function RoadmapProgressCard({ roadmap, isLoading }: RoadmapProgressCardProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Map className="size-5" />
						Roadmap Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!roadmap) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Map className="size-5" />
						Roadmap Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-sm text-muted-foreground py-8">
						No active roadmap. Generate one to start learning!
					</p>
				</CardContent>
			</Card>
		);
	}

	const nodes = roadmap.nodes || [];
	const completedNodes = nodes.filter((n: RoadmapNode) => n.status === "completed");
	const inProgressNodes = nodes.filter((n: RoadmapNode) => n.status === "inProgress");
	const completionPercentage = nodes.length > 0 ? (completedNodes.length / nodes.length) * 100 : 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Map className="size-5" />
						Roadmap Progress
					</div>
					<Badge variant="default" size="sm">
						{completedNodes.length}/{nodes.length}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Overall Progress</span>
						<span className="font-medium tabular-nums">{Math.round(completionPercentage)}%</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out"
							style={{ width: `${completionPercentage}%` }}
						/>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-2 text-center">
					<div className="rounded-lg bg-success/10 p-2">
						<CheckCircle className="mx-auto size-4 text-success" />
						<p className="mt-1 text-lg font-bold tabular-nums text-success">{completedNodes.length}</p>
						<p className="text-xs text-muted-foreground">Completed</p>
					</div>
					<div className="rounded-lg bg-blue-500/10 p-2">
						<Clock className="mx-auto size-4 text-blue-500" />
						<p className="mt-1 text-lg font-bold tabular-nums text-blue-500">{inProgressNodes.length}</p>
						<p className="text-xs text-muted-foreground">In Progress</p>
					</div>
					<div className="rounded-lg bg-muted/50 p-2">
						<Lock className="mx-auto size-4 text-muted-foreground" />
						<p className="mt-1 text-lg font-bold tabular-nums text-muted-foreground">
							{nodes.length - completedNodes.length - inProgressNodes.length}
						</p>
						<p className="text-xs text-muted-foreground">Locked</p>
					</div>
				</div>

				{inProgressNodes.length > 0 && (
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Current Focus</p>
						{inProgressNodes.slice(0, 2).map((node: RoadmapNode) => (
							<div key={node.nodeId} className="rounded-lg border bg-surface p-3">
								<p className="font-medium text-sm">{node.curriculumTitle}</p>
								<p className="text-xs text-muted-foreground">{node.skillName}</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
