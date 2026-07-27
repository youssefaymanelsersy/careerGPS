import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Merge build-time Vite env with runtime values injected by env.js.
// Runtime values take precedence so the same frontend image can be
// deployed to different environments without rebuilding.
const runtimeEnv = {
  ...(import.meta as any).env,
  ...(typeof globalThis !== "undefined" && "window" in globalThis
    ? (
        globalThis as typeof globalThis & {
          window: { __ENV__?: Record<string, string> };
        }
      ).window.__ENV__ ?? {}
    : {}),
};

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.union([
      z.string().url(),
      z.string().regex(/^\/.*/),
    ]),
    VITE_VAPID_PUBLIC_KEY: z.string().min(1),
  },
  runtimeEnv,
  emptyStringAsUndefined: true,
});
