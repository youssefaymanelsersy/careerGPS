"use client";

import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotificationPreferences() {
  return useQuery({
    ...trpc.notifications.getPreferences.queryOptions(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.notifications.updatePreferences.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.getPreferences.queryKey(),
      });
    },
  });
}

export function useRegisterPushSubscription() {
  return useMutation({
    ...trpc.notifications.registerPushSubscription.mutationOptions(),
  });
}

export function useUnregisterPushSubscription() {
  return useMutation({
    ...trpc.notifications.unregisterPushSubscription.mutationOptions(),
  });
}
