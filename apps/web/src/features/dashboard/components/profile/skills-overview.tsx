import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scoreTier, scoreBgClass } from "@/features/dashboard/utils";
import type { UserSkills } from "./profile.types";
import { Code, Star } from "lucide-react";

interface SkillsOverviewProps {
	skills: UserSkills;
}

export function SkillsOverview({ skills }: SkillsOverviewProps) {
	if (!skills || skills.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Code className="size-5" />
						Skills
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-sm text-muted-foreground py-8">
						No skills yet. Start learning to build your skill set!
					</p>
				</CardContent>
			</Card>
		);
	}

	const sortedSkills = [...skills].sort((a, b) => Number(b.strengthScore) - Number(a.strengthScore));
	const topSkills = sortedSkills.slice(0, 6);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Code className="size-5" />
						Skills
					</div>
					<Badge variant="default" size="sm">
						{skills.length} total
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-2">
					{topSkills.map((skill) => {
						const strength = Number(skill.strengthScore);
						const tier = scoreTier(strength);
						return (
							<div
								key={skill.skillId}
								className="group relative overflow-hidden rounded-xl border bg-surface p-4 transition-all hover:shadow-md"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<h4 className="font-semibold truncate">{skill.skillName}</h4>
										<div className="mt-2 flex items-center gap-2">
											<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
												<div
													className={`h-full rounded-full ${scoreBgClass[tier]} transition-all duration-700 ease-out`}
													style={{ width: `${strength}%` }}
												/>
											</div>
											<span className="text-xs font-medium tabular-nums">
												{Math.round(strength)}%
											</span>
										</div>
									</div>
									{strength >= 80 && (
										<Star className="size-4 fill-amber-400 text-amber-400 shrink-0" />
									)}
								</div>
							</div>
						);
					})}
				</div>
				{skills.length > 6 && (
					<p className="mt-4 text-center text-xs text-muted-foreground">
						+{skills.length - 6} more skills
					</p>
				)}
			</CardContent>
		</Card>
	);
}
