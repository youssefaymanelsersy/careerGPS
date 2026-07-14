import { z } from "zod";

export const startInterviewSchema = z.object({
  level: z.enum(["entry", "junior", "mid", "senior", "manager_lead"]),
  field: z.string().trim().min(1, "Field must not be empty"),
});

export const answerSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  transcript: z.string().trim(), // Allow empty strings if STT failed or user didn't speak
});

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

export const textToSpeechSchema = z.object({
  text: z.string().trim().min(1, "Text must not be empty"),
  voice: z.string().optional(),
});

export const speechToTextSchema = z.object({
  fileBase64: z.string().min(1, "Base64 file content is required"),
  fileName: z.string().trim().min(1, "File name must not be empty"),
});

