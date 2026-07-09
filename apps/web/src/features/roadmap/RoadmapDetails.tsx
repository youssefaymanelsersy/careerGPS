import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ActiveRoadmapNode } from "./roadmap.data";
import { Loader2 } from "lucide-react"; 
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";

interface Props {
  mapNode: ActiveRoadmapNode;
  isMutating: boolean;
  onMarkComplete: (id: string) => void;
  onOpenNext: () => void;
  onCloseMobile?: () => void; 
}

const PRIORITY_VARIANT: Record<string, "default" | "success" | "destructive" | "foreground" | "primary" | "warning"> = {
  high: "destructive",
  medium: "warning",
};

export function RoadmapDetails({ mapNode, isMutating, onMarkComplete, onOpenNext, onCloseMobile }: Props) {
  if (!mapNode) return null;
  
  const isLocked = mapNode.status === "pending"; 
  const isCompleted = mapNode.status === "completed";
  
  // Fetch detailed info for the active node
  const { data: nodeDetails, isLoading } = useQuery(
    trpc.roadmap.getNodeInfo.queryOptions(
      { nodeId: mapNode.nodeId },
      { enabled: !!mapNode?.nodeId }
    )
  );

  const resources = nodeDetails?.resources || [];

  return (
    <div className="flex flex-col gap-4 p-5 pb-7 min-h-full">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <span className="inline-block px-2.5 py-1 mb-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-200 dark:border-blue-800/50">
            Skill: {mapNode.skillName}
          </span>
          
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight mb-3">
            {mapNode.curriculumTitle}
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm italic mb-1">
               <Loader2 className="w-4 h-4 animate-spin" /> Loading details...
            </div>
          ) : nodeDetails?.description && (
            <div className="bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3.5 shadow-sm mb-1">
              <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed m-0 italic">
                "{nodeDetails.description}"
              </p>
            </div>
          )}
        </div>
        <button className="md:hidden flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base cursor-pointer" onClick={onCloseMobile}>✕</button>
      </div>
      
      <Separator className="bg-zinc-200 dark:bg-zinc-800 m-0" />

      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 rounded-md">
          <CardContent className="flex flex-col items-center gap-1.5 p-2.5">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">PRIORITY</span>
            <Badge variant={PRIORITY_VARIANT[mapNode.priority] || "default"} className="text-[11px]">{mapNode.priority}</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 rounded-md">
          <CardContent className="flex flex-col items-center gap-1.5 p-2.5">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">TIME</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">1 hr</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Learning Resources</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
             </div>
          ) : resources?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {resources.map((resource: any) => (
                <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <span className="text-xl flex-shrink-0">
                    {resource.type.toLowerCase().includes('youtube') ? '🎥' : '📄'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-snug">{resource.title}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{resource.type}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No resources available for this module.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-2 flex flex-col gap-2 shrink-0">
        {isLocked ? (
          <Button disabled variant="outline" className="w-full text-[13px] font-semibold h-[42px]">🔒 Complete previous steps first</Button>
        ) : isCompleted ? (
          <Button variant="outline" className="w-full text-[13px] font-semibold h-[42px]" onClick={onOpenNext}>Open next module</Button>
        ) : (
          <Button 
            disabled={isMutating} 
            className="w-full text-[13px] font-semibold h-[42px] bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black" 
            onClick={() => onMarkComplete(mapNode.nodeId)}
          >
            {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark as complete and open next"}
          </Button>
        )}
      </div>
    </div>
  );
}