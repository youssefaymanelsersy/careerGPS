import { trpc } from "@/utils/trpc";
import { env } from "@careergps/env/web";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncGithub() {
  return useMutation(
    trpc.github.syncProjects.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to sync GitHub");
      },
    }) as any,
  );
}

export function useUploadCV() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${env.VITE_SERVER_URL}/cv/parse`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(data.error || data.errorMessage || "Upload failed");
      }

      const json = await response.json() as {
        cvId: string;
        status: string;
        skills: { skillName: string; strength: number }[];
      };
      return json;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload CV");
    },
  });
}

export function useSearchSkills(skillWords: string) {
  return useQuery({
    ...trpc.skills.searchSkill.queryOptions({ skillWords }),
    enabled: skillWords.length >= 2,
  } as any);
}

export function useAddManualSkills() {
  return useMutation(
    trpc.skills.addManualSkill.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to save skills");
      },
    }) as any,
  );
}

export function useSetAvailability() {
  return useMutation(
    trpc.user.setAvailability.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to save availability");
      },
    }) as any,
  );
}

export function useGetAllRoles(includeScore: boolean) {
  return useQuery({
    ...trpc.roles.getAllRoles.queryOptions({ includeScore }),
  } as any);
}

export function useGenerateRoadmap() {
  return useMutation(
    trpc.roadmap.generate.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to generate roadmap");
      },
    }) as any,
  );
}

export function useSetUserRole() {
  return useMutation(
    trpc.roles.setUserRole.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to set career");
      },
    }) as any,
  );
}
