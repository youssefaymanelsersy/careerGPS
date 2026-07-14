"use client";

import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useUserInfo() {
  return useQuery({
    ...trpc.user.getUserInfo.queryOptions(),
  });
}

export function useActiveRole() {
  return useQuery({
    ...trpc.user.getUserRoleInfo.queryOptions(),
  });
}
 
export function useSetAvailability() {
  return useMutation({
    ...trpc.user.setAvailability.mutationOptions()
  });
}

export function useCalendarEvents(month: number, year: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return useQuery({
    ...trpc.calendar.getCalendar.queryOptions({ from, to }),
  });
}

export function useGenerateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.generate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.updateEvent.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.roadmap.getActiveRoadmap.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.streaks.get.queryKey() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.deleteEvent.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
    },
  });
}

