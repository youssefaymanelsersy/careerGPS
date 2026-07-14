import { RefreshCw, Code, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export function DataSyncCard() {
  const queryClient = useQueryClient();

  const { data: latestCv } = useQuery({
    ...trpc.cv.getLatestCV.queryOptions(),
  } as any);

  const { data: githubStats } = useQuery({
    ...trpc.github.getStats.queryOptions(),
  } as any);

  const reparseCvMutation = useMutation({
    ...trpc.cv.reparseCV.mutationOptions({
      onSuccess: () => {
        toast.success("CV reparsed successfully");
        queryClient.invalidateQueries({ queryKey: trpc.cv.getLatestCV.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.cv.getParsedData.queryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to reparse CV");
      }
    }) as any
  });

  const syncGithubMutation = useMutation({
    ...trpc.github.syncProjects.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub synced successfully");
        queryClient.invalidateQueries({ queryKey: trpc.readiness.getLatestReport.queryKey() } as any);
        queryClient.invalidateQueries({ queryKey: trpc.github.getProjects.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.github.getStats.queryKey() });
      },
      onError: (err: any) => {
        toast.error(`Failed to sync GitHub: ${err.message}`);
      }
    })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data Synchronization
        </CardTitle>
        <CardDescription>
          Manually trigger synchronization of your external profiles and CV data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="p-2 bg-primary/10 text-primary rounded-full">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">GitHub Projects</p>
              <p className="text-xs text-muted-foreground">Sync repositories & skills</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            disabled={syncGithubMutation.isPending}
            onClick={() => {
              const existingUsername = (githubStats as any)?.username;
              const username = existingUsername || window.prompt("Enter your GitHub username to sync:");
              if (username) {
                syncGithubMutation.mutate({ username } as any);
              }
            }}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${syncGithubMutation.isPending ? "animate-spin" : ""}`} />
            Sync GitHub
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="p-2 bg-primary/10 text-primary rounded-full">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Resume Parser</p>
              <p className="text-xs text-muted-foreground">Re-extract skills from latest CV</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            disabled={reparseCvMutation.isPending || !(latestCv as any)?.id}
            onClick={() => {
              const cv = latestCv as any;
              if (cv && cv.id) {
                reparseCvMutation.mutate({ cvId: cv.id } as any);
              }
            }}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${reparseCvMutation.isPending ? "animate-spin" : ""}`} />
            Reparse CV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
