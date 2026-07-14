import { Flame } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function StreakWidget() {
  const { data: streakData, isLoading } = useQuery({
    ...trpc.streaks.get.queryOptions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading || !streakData) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 animate-pulse">
        <Flame className="size-4 text-muted-foreground/50" />
        <span className="text-sm font-medium text-muted-foreground/50">--</span>
      </div>
    );
  }

  const { currentStreak, freezesAvailable } = streakData;
  
  // Decide colors based on streak length or freezes
  const isActive = currentStreak > 0;
  const isFrozen = currentStreak > 0 && freezesAvailable < 3; // Just a simple logic for now, freezesAvailable is 3 max
  
  // Realistically, if streak > 0 we color it orange
  // If we have a huge streak (e.g. > 7), make it red/hot
  
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border",
        isActive 
          ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" 
          : "bg-muted border-transparent text-muted-foreground"
      )}
      title={`Current Streak: ${currentStreak} days`}
    >
      <Flame 
        className={cn(
          "size-4", 
          isActive ? "fill-orange-500/20" : ""
        )} 
      />
      <span className="text-sm font-bold tracking-tight">
        {currentStreak}
      </span>
    </div>
  );
}
