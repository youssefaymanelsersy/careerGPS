import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
	return (
		<div className="space-y-6">
			<Card className="overflow-hidden">
				<div className="h-2 bg-muted" />
				<CardContent className="p-6">
					<div className="flex flex-col items-center gap-6 sm:flex-row">
						<Skeleton className="size-20 rounded-full" />
						<div className="flex-1 space-y-3">
							<Skeleton className="h-7 w-48" />
							<Skeleton className="h-4 w-64" />
							<Skeleton className="h-4 w-32" />
						</div>
						<div className="flex gap-4 sm:flex-col sm:items-end">
							<div className="space-y-1.5">
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-16" />
							</div>
							<div className="space-y-1.5">
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<Card className="overflow-hidden">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-4">
								<Skeleton className="size-24 rounded-full" />
								<div className="text-center space-y-2">
									<Skeleton className="mx-auto h-7 w-24" />
									<Skeleton className="mx-auto h-4 w-16" />
								</div>
								<div className="w-full space-y-2">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-2 w-full rounded-full" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className="lg:col-span-2">
					<div className="grid gap-4 sm:grid-cols-2 h-full">
						{[1, 2, 3, 4].map((i) => (
							<Card key={i}>
								<CardContent className="p-4">
									<div className="flex items-center gap-3">
										<Skeleton className="size-10 rounded-xl" />
										<div className="space-y-1.5">
											<Skeleton className="h-7 w-12" />
											<Skeleton className="h-3 w-20" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardContent className="p-6 space-y-4">
						<Skeleton className="h-5 w-24" />
						<div className="grid gap-3 sm:grid-cols-2">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-20 rounded-xl" />
							))}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6 space-y-3">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-12 rounded-lg" />
						<Skeleton className="h-12 rounded-lg" />
						<Skeleton className="h-12 rounded-lg" />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="p-6 space-y-3">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-8 w-40" />
					{[1, 2, 3, 4, 5].map((i) => (
						<Skeleton key={i} className="h-14 rounded-xl" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
