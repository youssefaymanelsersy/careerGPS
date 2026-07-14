import { env } from "@careergps/env/web";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        roleId: {
          type: "string",
          required: false,
        },
        availableDaysPerWeek: {
          type: "number",
          isNumber: true,
          required: false,
        },
        availableWeekdays: {
          type: "number[]",
          isNumber: true,
          required: false,
        },
        availableHoursPerDay: {
          type: "number",
          isNumber: true,
          required: false,
        },
        timezone: {
          type: "string",
          required: false,
        },
        preferredStartTime: {
          type: "string",
          required: false,
        },
        isOnboarded: {
          type: "boolean",
          required: false,
        },
      },
    }),
  ],
});
