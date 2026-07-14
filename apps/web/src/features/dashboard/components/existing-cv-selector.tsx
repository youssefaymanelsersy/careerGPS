import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";

interface ExistingCvSelectorProps {
  onUseExisting: (cvUrl: string, cvId: string) => void;
  disabled?: boolean;
}

export function ExistingCvSelector({ onUseExisting, disabled }: ExistingCvSelectorProps) {
  const { data: latestCv, isLoading } = useQuery({
    ...trpc.cv.getLatestCV.queryOptions(),
  } as any);

  if (isLoading || !latestCv) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20 border-dashed">
        <FileText className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="font-medium">No Existing Resume Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You don't have a resume saved to your profile yet. Please upload a new one.
        </p>
      </div>
    );
  }

  const cv = latestCv as any;
  const timeAgo = cv.createdAt ? formatDistanceToNow(new Date(cv.createdAt), { addSuffix: true }) : "recently";

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl h-fit">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h4 className="font-semibold text-lg line-clamp-1" title={cv.fileName}>
              {cv.fileName}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Uploaded {timeAgo}
            </p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          disabled={disabled || !cv.fileUrl || !cv.id}
          onClick={() => onUseExisting(cv.fileUrl, cv.id)}
          className="shrink-0 rounded-full pl-5 pr-4 shadow-md bg-gradient-to-r from-primary to-primary/80 hover:to-primary"
        >
          Select Resume
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
