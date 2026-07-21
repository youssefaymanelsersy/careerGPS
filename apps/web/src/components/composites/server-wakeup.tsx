import React, { useState, useEffect } from "react";
import { env } from "@careergps/env/web";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const funnyMessages = [
  "Knocking on the server's door...",
  "Pouring coffee into the backend...",
  "Waking up the hamsters in the server rack...",
  "Telling the database to stop hitting the snooze button...",
  "Bribing the load balancer...",
  "Reticulating splines...",
  "Untangling the web sockets...",
  "The server is doing its morning stretches...",
  "Searching for the 'Any' key...",
];

export function ServerWakeup({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "sleeping" | "online">("checking");
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval>;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for the ping

        const res = await fetch(`${env.VITE_SERVER_URL}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          setStatus("online");
          clearInterval(pollingInterval);
        } else {
          if (status === "checking") setStatus("sleeping");
        }
      } catch (err) {
        if (status === "checking") setStatus("sleeping");
      }
    };

    // Initial check
    checkHealth();

    // Set up polling
    pollingInterval = setInterval(() => {
      if (status !== "online") {
        checkHealth();
      }
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [status]);

  useEffect(() => {
    let messageInterval: ReturnType<typeof setInterval>;
    
    if (status === "sleeping") {
      messageInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % funnyMessages.length);
      }, 3500); // Change message every 3.5 seconds
    }

    return () => clearInterval(messageInterval);
  }, [status]);

  if (status === "online") {
    return <>{children}</>;
  }

  // Fallback for the very first split second (checking) before showing the funny screen
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-md flex-col items-center gap-6"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <motion.div 
            className="absolute -bottom-2 -right-2 text-4xl"
            animate={{ 
              rotate: [0, -20, 20, -20, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            ☕
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Backend is waking up!</h1>
          <p className="text-muted-foreground">
            Since our server was resting, it takes about 50 seconds to boot up.
          </p>
        </div>

        <div className="h-16 w-full px-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium text-primary text-center"
            >
              {funnyMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
