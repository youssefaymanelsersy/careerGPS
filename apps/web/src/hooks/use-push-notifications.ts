import { useState, useEffect } from "react";
import { env } from "@careergps/env/web";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import { useMutation } from "@tanstack/react-query";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  
  const registerMutation = useMutation({
    ...trpc.notifications.registerPushSubscription.mutationOptions(),
  });

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Register service worker if not already registered
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed: ", err);
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("You denied push notifications.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(env.VITE_VAPID_PUBLIC_KEY),
        });
      }

      const subData = subscription.toJSON();
      
      if (!subData.endpoint || !subData.keys?.p256dh || !subData.keys?.auth) {
        throw new Error("Invalid subscription data");
      }

      await registerMutation.mutateAsync({
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth,
        deviceLabel: navigator.userAgent,
      });

      toast.success("Successfully enabled push notifications!");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable push notifications.");
    }
  };

  return {
    isSupported,
    permission,
    subscribe,
    isSubscribing: registerMutation.isPending
  };
}
