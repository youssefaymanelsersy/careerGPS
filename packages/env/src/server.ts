import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
<<<<<<< HEAD
    HUGGING_FACE_CV_ATS_API_KEY: z.string().min(1),
    HUGGING_FACE_SKILL_MATCHING_API_KEY: z.string().min(1),
=======
>>>>>>> 6ef452d17d829a8a0344d679e36a5c5a285f996a
    BETTER_AUTH_URL: z.string().url(),
    CORS_ORIGIN: z.string().url(),
    SERVER_URL: z.string().url(),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    AI_TEAM_URL: z.string().url(),
    AI_TEAM_SECRET: z.string().min(32),
<<<<<<< HEAD
=======

    HUGGING_FACE_CV_ATS_API_KEY: z.string().min(1),
    HUGGING_FACE_SKILL_MATCHING_API_KEY: z.string().min(1),
>>>>>>> 6ef452d17d829a8a0344d679e36a5c5a285f996a
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
