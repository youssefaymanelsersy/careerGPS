import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@careergps/env/web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/composites/loader";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useRegisterPushSubscription,
} from "../service";

const CATEGORY_LABELS: Record<string, { title: string; description: string }> = {
  reminders: {
    title: "Session reminders",
    description: "Upcoming study session reminders and missed-session alerts.",
  },
  streaks: {
    title: "Streaks",
    description: "Streak-at-risk warnings, milestones, and streak breaks.",
  },
  milestones: {
    title: "Milestones",
    description: "Roadmap node completions and other progress milestones.",
  },
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function CategoryRow({
  pref,
  onChange,
}: {
  pref: any;
  onChange: (category: string, updates: any) => void;
}) {
  const meta = CATEGORY_LABELS[pref.category] ?? {
    title: pref.category,
    description: "",
  };

  const handleToggle = (
    field: "channelInApp" | "channelEmail" | "channelPush",
    value: boolean,
  ) => {
    onChange(pref.category, { [field]: value });
  };

  const handleQuietHoursChange = (field: "quietHoursStart" | "quietHoursEnd", value: string) => {
    onChange(pref.category, { [field]: value.length === 5 ? `${value}:00` : value });
  };

  return (
    <div className="space-y-3 py-4">
      <div>
        <p className="text-sm font-medium">{meta.title}</p>
        {meta.description && (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={pref.channelInApp}
            onCheckedChange={(v) => handleToggle("channelInApp", v === true)}
          />
          In-app
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={pref.channelEmail}
            onCheckedChange={(v) => handleToggle("channelEmail", v === true)}
          />
          Email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={pref.channelPush}
            onCheckedChange={(v) => handleToggle("channelPush", v === true)}
          />
          Push
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Field className="w-auto">
          <FieldLabel className="text-xs text-muted-foreground">Quiet hours start</FieldLabel>
          <Input
            type="time"
            className="w-32"
            value={pref.quietHoursStart?.slice(0, 5) ?? "22:00"}
            onChange={(e) => handleQuietHoursChange("quietHoursStart", e.target.value)}
          />
        </Field>
        <Field className="w-auto">
          <FieldLabel className="text-xs text-muted-foreground">Quiet hours end</FieldLabel>
          <Input
            type="time"
            className="w-32"
            value={pref.quietHoursEnd?.slice(0, 5) ?? "08:00"}
            onChange={(e) => handleQuietHoursChange("quietHoursEnd", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

export function NotificationsSection() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const registerPush = useRegisterPushSubscription();

  const [pushSupported, setPushSupported] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);

  const [localPrefs, setLocalPrefs] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences && !hasChanges) {
      setLocalPrefs(JSON.parse(JSON.stringify(preferences)));
    }
  }, [preferences, hasChanges]);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushGranted(Notification.permission === "granted");
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

        registerPush.mutate(
          {
            endpoint: sub.endpoint,
            p256dh,
            auth,
            deviceLabel: navigator.userAgent,
          } as any,
          {
            onSuccess: () => toast.success("Push notifications enabled!"),
            onError: (err: any) => toast.error(`Failed to enable push notifications: ${err.message}`),
          },
        );
      } else {
        toast.error("Failed to extract push keys.");
      }
    } catch (err: any) {
      toast.error(`Error enabling push notifications: ${err.message}`);
    }
  };

  const handlePrefChange = (category: string, updates: any) => {
    setLocalPrefs((prev) =>
      prev.map((p) => (p.category === category ? { ...p, ...updates } : p))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    let errorCount = 0;

    for (const localPref of localPrefs) {
      const originalPref = (preferences as any[]).find(p => p.category === localPref.category);
      if (JSON.stringify(localPref) !== JSON.stringify(originalPref)) {
        try {
          await updatePreferences.mutateAsync({
            category: localPref.category,
            channelInApp: localPref.channelInApp,
            channelEmail: localPref.channelEmail,
            channelPush: localPref.channelPush,
            quietHoursStart: localPref.quietHoursStart,
            quietHoursEnd: localPref.quietHoursEnd,
          } as any);
        } catch (err) {
          errorCount++;
        }
      }
    }

    setIsSaving(false);
    if (errorCount === 0) {
      toast.success("Notification preferences saved successfully.");
      setHasChanges(false);
    } else {
      toast.error(`Failed to save some preferences.`);
    }
  };

  const handleDiscard = () => {
    if (preferences) {
      setLocalPrefs(JSON.parse(JSON.stringify(preferences)));
      setHasChanges(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose how and when CareerGPS notifies you about your study schedule and progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !preferences ? (
          <Loader />
        ) : (
          <>
            {pushSupported && !pushGranted && (
              <div className="mb-2 flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Enable browser push notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified on this device even when CareerGPS isn't open.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnablePush}
                  disabled={registerPush.isPending}
                >
                  Enable
                </Button>
              </div>
            )}
            <div className="divide-y">
              {localPrefs.map((pref) => (
                <CategoryRow key={pref.category} pref={pref} onChange={handlePrefChange} />
              ))}
            </div>
          </>
        )}
      </CardContent>
      {preferences && (
        <div className="flex justify-end gap-3 border-t p-4">
          {hasChanges && (
            <Button variant="outline" onClick={handleDiscard} disabled={isSaving}>
              Discard Changes
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </Card>
  );
}
