import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useRemainingInterviews() {
  return useQuery({
    ...trpc.interview.getRemainingInterviews.queryOptions(),
  } as any);
}

export function useAllRoles(includeScore: boolean = false) {
  return useQuery({
    ...trpc.roles.getAllRoles.queryOptions({ includeScore }),
  } as any);
}

export function useStartInterview() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.interview.start.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.interview.getRemainingInterviews.queryKey(),
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to start interview");
      },
    }),
  ) as any;

  const startInterview = (input: { level: string; field: string }) => {
    return mutation.mutateAsync(input);
  };

  return {
    ...mutation,
    startInterview,
  };
}

export function useGetSession(sessionId: string, pollInterval?: number) {
  return useQuery({
    ...trpc.interview.getSession.queryOptions({ sessionId }),
    enabled: !!sessionId,
    refetchInterval: pollInterval,
  } as any);
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.interview.answer.mutationOptions({
      onError: (error: any) => {
        toast.error(error.message || "Failed to submit answer");
      },
    }),
  ) as any;

  const submitAnswer = (input: { sessionId: string; transcript: string }) => {
    return mutation.mutateAsync(input);
  };

  return { ...mutation, submitAnswer };
}
