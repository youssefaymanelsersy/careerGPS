import React, { useEffect, useRef, useState } from "react";
import { BellIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/features/dashboard/components/notification-messages";
import { getNotificationMessage } from "./notification-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { env } from "@careergps/env/web";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const lastSeenNotificationId = useRef<string | null>(null);

  const { data: unreadData } = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    refetchInterval: 20000,
  });

  const { data: rawData } = useQuery({
    ...trpc.notifications.list.queryOptions(),
    refetchInterval: 20000,
  });

  const notifications = Array.isArray(rawData) ? rawData : [];

  // Watch for new notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const newest = notifications[0];
      if (lastSeenNotificationId.current && newest.id !== lastSeenNotificationId.current) {
        if (newest.status !== "read") {
           toast.info(getNotificationMessage(newest.type as NotificationType, newest.payload));
        }
      }
      lastSeenNotificationId.current = newest.id;
    }
  }, [notifications]);

  const markRead = useMutation({
    ...trpc.notifications.markRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notifications.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.notifications.getUnreadCount.queryKey() });
      },
    }),
  });

  const markAllRead = useMutation({
    ...trpc.notifications.markAllRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notifications.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.notifications.getUnreadCount.queryKey() });
      },
    }),
  });

  const registerPush = useMutation({
    ...trpc.notifications.registerPushSubscription.mutationOptions({
      onSuccess: () => {
        toast.success("Push notifications enabled!");
      },
      onError: (err: any) => {
        toast.error(`Failed to enable push notifications: ${err.message}`);
      }
    }),
  });

  const [pushSupported, setPushSupported] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushGranted(Notification.permission === "granted");
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied.");
        return;
      }
      setPushGranted(true);

      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        const applicationServerKey = urlBase64ToUint8Array(env.VITE_VAPID_PUBLIC_KEY);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      const authBuffer = sub.getKey("auth");
      const p256dhBuffer = sub.getKey("p256dh");
      
      if (sub.endpoint && authBuffer && p256dhBuffer) {
        const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authBuffer))));
        const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhBuffer))));

        registerPush.mutate({
          endpoint: sub.endpoint,
          p256dh,
          auth,
          deviceLabel: navigator.userAgent,
        } as any);
      } else {
        toast.error("Failed to extract push keys.");
      }
    } catch (err: any) {
      toast.error(`Error enabling push notifications: ${err.message}`);
    }
  };

  const unreadCount = (unreadData as any)?.count || 0;

  return (
    <DropdownMenu>
      {/* @ts-ignore - Radix UI typing issue with asChild */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="font-semibold text-sm">Notifications</div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs" 
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif: any) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notif.status !== "read" ? "bg-muted/50" : ""}`}
                onClick={(e) => {
                  e.preventDefault(); 
                  if (notif.status !== "read") {
                    markRead.mutate({ id: notif.id } as any);
                  }
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">
                    {getNotificationMessage(notif.type as NotificationType, notif.payload)}
                  </span>
                  {notif.status !== "read" && (
                    <div className="h-2 w-2 mt-1 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {pushSupported && !pushGranted && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="outline" 
                className="w-full text-xs" 
                size="sm"
                onClick={handleEnablePush}
                disabled={registerPush.isPending}
              >
                Enable Push Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
