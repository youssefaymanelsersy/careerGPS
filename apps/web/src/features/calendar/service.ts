"use client";

import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

export function useUserInfo() {
  return useQuery({
    ...trpc.user.getUserInfo.queryOptions(),
  } as any);
}

export function useActiveRole() {
  return useQuery({
    ...trpc.user.getUserRoleInfo.queryOptions(),
  } as any);
}
 
export function useSetAvailability() {
  return useMutation(
    trpc.user.setAvailability.mutationOptions() as any,
  );
}

export function useCalendarEvents(month: number, year: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return useQuery({
    ...trpc.calendar.getCalendar.queryOptions({ from, to }),
  } as any);
}

export function useGenerateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.generate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
    },
  } as any);
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.updateEvent.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
    },
  } as any);
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.calendar.deleteEvent.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.calendar.getCalendar.queryKey() });
    },
  } as any);
}

export function useStudyNotifications() {
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: calendarData } = useCalendarEvents(
    new Date().getMonth(),
    new Date().getFullYear()
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;

      const events = (calendarData as any)?.events;
      if (!events) return;

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const todayEvents = events.filter(
        (e: any) => e.event.date === todayStr && e.event.status === "scheduled"
      );

      for (const { event } of todayEvents) {
        const [h, m] = event.startTime.split(":").map(Number);
        if (now.getHours() === h && now.getMinutes() === m) {
          const key = `${event.id}-${event.startTime}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            new Notification("Study Time!", {
              body: `Time to study: ${event.startTime} - ${event.endTime}`,
            });
          }
        }
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, [calendarData]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    return Notification.requestPermission();
  }, []);

  return {
    requestPermission,
    permission:
      typeof Notification !== "undefined"
        ? Notification.permission
        : "denied",
    isSupported: typeof Notification !== "undefined",
  };
}
