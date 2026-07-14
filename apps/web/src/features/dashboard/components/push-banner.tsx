import { BellRing, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PushNotificationBanner() {
  const { isSupported, permission, subscribe, isSubscribing } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // If unsupported, already granted, denied, or manually dismissed, don't show the banner
  if (!isSupported || permission !== "default" || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="w-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-blue-500/20"
      >
        <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/20">
                <BellRing className="size-4 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-foreground">
                <span className="md:hidden">Enable notifications to never miss a study session!</span>
                <span className="hidden md:inline">
                  Stay on track! Enable push notifications to get reminders before your study sessions begin.
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="default" 
                size="sm" 
                onClick={subscribe}
                disabled={isSubscribing}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isSubscribing ? "Enabling..." : "Enable"}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
