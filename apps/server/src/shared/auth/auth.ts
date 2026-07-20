import { db } from "@/db";
import * as authSchema from "@/modules/auth/db/schema";
import { user } from "@/modules/user/db/schema";
import { env } from "@careergps/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { VerificationEmail, getVerificationSubject } from "@careergps/emails";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...authSchema, user },
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async (data) => {
        const { Resend } = await import("resend");
        const resend = new Resend(env.RESEND_API_KEY);
        
        const frontendUrl = `${env.CORS_ORIGIN}/verify-email?type=reset_password&token=${data.token}`;
        await resend.emails.send({
            from: "CareerGPS <auth@updates.careergps.space>",
            to: data.user.email,
            subject: getVerificationSubject("reset_password"),
            react: VerificationEmail({ type: "reset_password", url: frontendUrl }),
        });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (data) => {
        const { Resend } = await import("resend");
        const resend = new Resend(env.RESEND_API_KEY);
        
        const frontendUrl = `${env.CORS_ORIGIN}/verify-email?type=verify_email&token=${data.token}`;
        await resend.emails.send({
            from: "CareerGPS <auth@updates.careergps.space>",
            to: data.user.email,
            subject: getVerificationSubject("verify_email"),
            react: VerificationEmail({ type: "verify_email", url: frontendUrl }),
        });
    }
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for"],
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  user: {
    additionalFields: {
      systemRole: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      roleId: {
        type: "string",
        required: false,
      },
      availableDaysPerWeek: {
        type: "number",
        required: false,
      },
      availableWeekdays: {
        type: "number[]",
        required: false,
      },
      availableHoursPerDay: {
        type: "number",
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
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const adminEmailsStr = process.env.ADMIN_EMAILS || "";
          const adminEmails = adminEmailsStr.split(",").map(e => e.trim().toLowerCase());
          
          if (adminEmails.includes(user.email.toLowerCase())) {
            return {
              data: {
                ...user,
                systemRole: "admin"
              }
            };
          }
          return { data: user };
        }
      }
    }
  },
  plugins: [],
});
