import { RefreshCw, Code, Database, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { env } from "@careergps/env/web";
import { useRef, useState } from "react";
import { ManageSkillsModal, type ModalSkill, strengthToLevel } from "./manage-skills-modal";

export function DataSyncCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSkills, setReviewSkills] = useState<ModalSkill[]>([]);
  const [preservedSkills, setPreservedSkills] = useState<ModalSkill[]>([]);

  const { data: latestCv } = useQuery({
    ...trpc.cv.getLatestCV.queryOptions(),
  } as any);

  const { data: githubStats } = useQuery({
    ...trpc.github.getStats.queryOptions(),
  } as any);

  const { data: userSkills } = useQuery({
    ...trpc.skills.getUserSkills.queryOptions(),
  });

  const userSkillsRef = useRef<any[] | undefined>(userSkills);
  // Keep the ref constantly updated to the absolute freshest state
  userSkillsRef.current = userSkills;

  const normalizeSkillName = (name: string) => {
    let s = (name || "").toLowerCase().trim();
    s = s.replace(/\d+/g, ""); // strip numbers like HTML5 -> html
    s = s.replace(/[.\-_\s]+/g, ""); // strip spaces, dots, dashes
    s = s.replace(/[^a-z0-9#+]/g, ""); // strip weird chars
    const aliasMap: Record<string, string> = {
        csharp: "c#",
        cpp: "c++",
        "csharp#": "c#",
    };
    return aliasMap[s] ?? s;
  };

  const mergeSkillsForReview = (extractedTechnical: any[]) => {
      // Use the foolproof ref so we aren't affected by stale closures or query key mismatches
      const latestUserSkills = userSkillsRef.current;
      
      const existing: ModalSkill[] = (latestUserSkills || []).map(s => ({
          skillId: s.skillId,
          skillName: s.skillName,
          level: strengthToLevel(s.strengthScore)
      }));

      const existingMap = new Map<string, ModalSkill>();
      for (const e of existing) {
          existingMap.set(normalizeSkillName(e.skillName), e);
      }

      const newSkillsMap = new Map<string, ModalSkill>();

      if (extractedTechnical) {
          for (const s of extractedTechnical) {
              const rawName = s.skillName || s.name;
              if (!rawName) continue;
              
              const normalizedName = normalizeSkillName(rawName);
              if (!normalizedName) continue;
              
              // Only add to review if it doesn't already exist in the user's current skills
              if (!existingMap.has(normalizedName)) {
                  const parsedLevel = strengthToLevel(s.strength || 50);
                  if (!newSkillsMap.has(normalizedName)) {
                      newSkillsMap.set(normalizedName, { skillName: rawName.trim(), level: parsedLevel });
                  }
              }
          }
      }

      setPreservedSkills(existing); // Keep existing ones safe from deletion
      setReviewSkills(Array.from(newSkillsMap.values()));
      
      // If there are no new skills, we don't necessarily need to show the modal,
      // but showing it empty or with a toast might be better. Let's just show it.
      setIsReviewModalOpen(true);
  };

  const reparseCvMutation = useMutation({
    ...trpc.cv.reparseCV.mutationOptions({
      onSuccess: (data: any) => {
        toast.success("CV reparsed successfully, please review your skills.");
        mergeSkillsForReview(data.parsedData?.skills?.technical || []);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to reparse CV");
      }
    }) as any
  });

  const syncGithubMutation = useMutation({
    ...trpc.github.syncProjects.mutationOptions({
      onSuccess: (data: any) => {
        toast.success("GitHub synced successfully, please review your extracted skills.");
        queryClient.invalidateQueries({ queryKey: trpc.readiness.getLatestReport.queryKey() } as any);
        queryClient.invalidateQueries({ queryKey: trpc.github.getProjects.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.github.getStats.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.roadmap.getActiveRoadmap.queryKey() } as any);
        
        mergeSkillsForReview(data?.skills || []);
      },
      onError: (err: any) => {
        toast.error(`Failed to sync GitHub: ${err.message}`);
      }
    })
  });

  const [githubPromptOpen, setGithubPromptOpen] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");

  const handleGithubSync = () => {
    const existingUsername = (githubStats as any)?.username;
    if (existingUsername) {
      syncGithubMutation.mutate({ username: existingUsername } as any);
    } else {
      setGithubPromptOpen(true);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${env.VITE_SERVER_URL}/cv/parse`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errorMessage || "Failed to upload CV");
      
      toast.success("CV parsed successfully, please review your skills.");
      mergeSkillsForReview(data.skills || []);
      
    } catch (err: any) {
      toast.error(err.message || "Failed to upload CV");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const hasCv = !!(latestCv as any)?.id;

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
            onClick={handleGithubSync}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${syncGithubMutation.isPending ? "animate-spin" : ""}`} />
            Sync GitHub
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="p-2 bg-primary/10 text-primary rounded-full">
              {hasCv ? <RefreshCw className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-sm">{hasCv ? "Resume Parser" : "Upload Resume"}</p>
              <p className="text-xs text-muted-foreground">
                {hasCv ? "Re-extract skills from latest CV" : "Upload your CV to extract skills"}
              </p>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf" 
            onChange={handleUpload} 
          />

          {hasCv ? (
            <Button 
              variant="outline" 
              size="sm"
              disabled={reparseCvMutation.isPending}
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
          ) : (
            <Button 
              variant="default" 
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Upload className="w-3 h-3 mr-2" />
              )}
              {isUploading ? "Uploading..." : "Upload CV"}
            </Button>
          )}
        </div>
      </CardContent>
      <ManageSkillsModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialSkills={reviewSkills}
        preserveSkills={preservedSkills}
        title="Review Extracted Skills"
        description="We analyzed your data and extracted the following skills. Please review them, adjust their levels if necessary, and save to sync your roadmaps."
        onSaved={() => {
            queryClient.invalidateQueries({ queryKey: trpc.cv.getLatestCV.queryKey() });
            queryClient.invalidateQueries({ queryKey: trpc.cv.getParsedData.queryKey() });
            queryClient.invalidateQueries({ queryKey: trpc.readiness.getLatestReport.queryKey() } as any);
            queryClient.invalidateQueries({ queryKey: trpc.roadmap.getActiveRoadmap.queryKey() } as any);
            queryClient.invalidateQueries({ queryKey: trpc.skills.getUserSkills.queryKey() });
            window.location.reload(); 
        }}
      />

      {/* GitHub Username Prompt Modal */}
      {githubPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-lg border-border bg-surface">
            <CardHeader>
              <CardTitle>Sync GitHub</CardTitle>
              <CardDescription>Enter your GitHub username to extract skills from your projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                autoFocus
                type="text"
                placeholder="e.g. octocat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && githubUsername.trim()) {
                    setGithubPromptOpen(false);
                    syncGithubMutation.mutate({ username: githubUsername.trim() } as any);
                  }
                }}
              />
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setGithubPromptOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (githubUsername.trim()) {
                    setGithubPromptOpen(false);
                    syncGithubMutation.mutate({ username: githubUsername.trim() } as any);
                  }
                }}
                disabled={!githubUsername.trim()}
              >
                Sync
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
