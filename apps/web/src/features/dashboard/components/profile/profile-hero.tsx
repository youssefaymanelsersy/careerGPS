import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TIER_COLORS, calculateTier, type GamificationTier } from "./profile.types";
import { Briefcase, Crown, Diamond, Medal, Star, Trophy, PlusIcon, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { env } from "@careergps/env/web";

interface ProfileHeroProps {
	user: {
		name: string;
		email: string;
		image?: string | null;
		roleId?: string | null;
	};
	roleTitle?: string | null;
	finalScore: number;
	activityScore: number;
}

const TIER_ICONS: Record<GamificationTier, React.ComponentType<{ className?: string }>> = {
	Bronze: Medal,
	Silver: Star,
	Gold: Trophy,
	Diamond: Diamond,
	Master: Crown,
};

export function ProfileHero({ user, roleTitle, finalScore, activityScore }: ProfileHeroProps) {
	const tier = calculateTier(finalScore, activityScore);
	const colors = TIER_COLORS[tier];
	const TierIcon = TIER_ICONS[tier];
	const initials = user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("image", file);

			const res = await fetch(env.VITE_SERVER_URL + "/user/avatar", {
				method: "POST",
				body: formData,
				credentials: "include"
			});

			if (!res.ok) throw new Error("Upload failed");

			const data = await res.json();
			if (data.url) {
				await authClient.updateUser({ image: data.url });
				toast.success("Profile picture updated");
			}
		} catch (error) {
			toast.error("Failed to upload image");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Card className="overflow-hidden">
			<div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
			<CardContent className="p-6">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-center">
					<div className="relative inline-block">
						<Avatar className="size-20">
							<AvatarImage src={user.image || undefined} alt={user.name} />
							<AvatarFallback className="text-lg">{initials}</AvatarFallback>
						</Avatar>
						<button 
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
							aria-label="Upload profile picture"
						>
							{isUploading ? <Loader2Icon className="size-3 animate-spin" /> : <PlusIcon className="size-3" />}
						</button>
						<input 
							type="file" 
							ref={fileInputRef} 
							onChange={handleImageChange} 
							accept="image/*" 
							className="hidden" 
						/>
					</div>

					<div className="flex-1 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-2xl font-bold">{user.name}</h1>
							<Badge variant={tier === "Master" ? "default" : "default"} className={colors.text}>
								<TierIcon className="size-3" />
								{tier}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{user.email}</p>
						{roleTitle && (
							<div className="flex items-center gap-1.5 text-sm">
								<Briefcase className="size-4 text-muted-foreground" />
								<span className="font-medium">{roleTitle}</span>
							</div>
						)}
					</div>

					<div className="flex gap-4 sm:flex-col sm:items-end">
						<div className="text-center sm:text-right">
							<p className="text-2xl font-bold tabular-nums">{Math.round(finalScore)}</p>
							<p className="text-xs text-muted-foreground">Readiness</p>
						</div>
						<div className="text-center sm:text-right">
							<p className="text-2xl font-bold tabular-nums">{Math.round(activityScore)}</p>
							<p className="text-xs text-muted-foreground">Activity</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
