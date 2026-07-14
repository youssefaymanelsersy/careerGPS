import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interviewUsage } from "./db/schema";
import { aiInterviewClient } from "./client";
import { speechClient } from "./speech.client";
import {
  SessionNotFoundError,
  SessionTimeoutError,
  AIInterviewServiceError,
  SpeechServiceError,
  SpeechTimeoutError,
} from "./types";
import type {
  AIInterviewStartResponse,
  AIInterviewAnswerResponse,
  AIInterviewTerminalResponse,
  SpeechToTextResponse,
} from "./types";
import { z } from "zod";
import { startInterviewSchema, answerSchema } from "./validation";

const MAX_FREE_INTERVIEWS = 2;

/** Returns the start of the current calendar month in UTC (midnight on the 1st). */
function getCurrentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Checks the user's monthly quota without consuming it.
 * Throws TRPCError(FORBIDDEN) if the limit is already reached.
 */
export async function checkQuota(userId: string): Promise<void> {
  const currentPeriod = getCurrentPeriodStart();
  const existing = await db.query.interviewUsage.findFirst({
    where: eq(interviewUsage.userId, userId),
  });

  if (!existing) return; // No record yet — free to go

  // New calendar month → previous period expired, quota refreshed.
  if (existing.periodStart.getTime() < currentPeriod.getTime()) return;

  if (existing.interviewsUsed >= MAX_FREE_INTERVIEWS) {
    const nextReset = new Date(
      Date.UTC(currentPeriod.getUTCFullYear(), currentPeriod.getUTCMonth() + 1, 1)
    );
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Monthly interview limit reached. Your quota resets on ${nextReset.toISOString().slice(0, 10)}.`,
    });
  }
}

/**
 * Increments the user's interview usage counter by one.
 * Creates the record if it doesn't exist, resets on a new calendar month.
 * Call only when an interview completes successfully (terminal response).
 */
export async function incrementQuota(userId: string): Promise<void> {
  const currentPeriod = getCurrentPeriodStart();
  const existing = await db.query.interviewUsage.findFirst({
    where: eq(interviewUsage.userId, userId),
  });

  if (!existing) {
    await db.insert(interviewUsage).values({
      userId,
      interviewsUsed: 1,
      periodStart: currentPeriod,
    });
    return;
  }

  const isNewPeriod = existing.periodStart.getTime() < currentPeriod.getTime();
  if (isNewPeriod) {
    await db
      .update(interviewUsage)
      .set({ interviewsUsed: 1, periodStart: currentPeriod })
      .where(eq(interviewUsage.userId, userId));
    return;
  }

  await db
    .update(interviewUsage)
    .set({ interviewsUsed: existing.interviewsUsed + 1 })
    .where(eq(interviewUsage.userId, userId));
}

/** Returns the remaining free interviews and the reset date for the current period. */
export async function getRemainingInterviewsService(
  userId: string
): Promise<{ remaining: number; resetsOn: string }> {
  const currentPeriod = getCurrentPeriodStart();
  const nextReset = new Date(
    Date.UTC(currentPeriod.getUTCFullYear(), currentPeriod.getUTCMonth() + 1, 1)
  );
  const resetsOn = nextReset.toISOString().slice(0, 10);

  const existing = await db.query.interviewUsage.findFirst({
    where: eq(interviewUsage.userId, userId),
  });

  if (!existing || existing.periodStart.getTime() < currentPeriod.getTime()) {
    // No record yet or a stale record from a previous period → full quota available.
    return { remaining: MAX_FREE_INTERVIEWS, resetsOn };
  }

  const remaining = Math.max(0, MAX_FREE_INTERVIEWS - existing.interviewsUsed);
  return { remaining, resetsOn };
}


export function getQuestionMix(level: string): { technical: number; soft: number } {
  switch (level) {
    case "entry":
      return { technical: 6, soft: 4 };
    case "junior":
      return { technical: 7, soft: 4 };
    case "mid":
      return { technical: 8, soft: 4 };
    case "senior":
      return { technical: 9, soft: 4 };
    case "manager_lead":
      return { technical: 6, soft: 6 };
    default:
      // Fallback to entry if unknown
      return { technical: 6, soft: 4 };
  }
}

export function handleInterviewServiceError(error: unknown): never {
  if (error instanceof SessionNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "session_interrupted: The interview couldn't continue because the session was lost. Please start a new session.",
    });
  }
  
  if (error instanceof SessionTimeoutError) {
    throw new TRPCError({
      code: "TIMEOUT",
      message: "session_interrupted: The interview couldn't continue due to a timeout. Please start a new session.",
    });
  }

  if (error instanceof AIInterviewServiceError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Unknown error occurred",
  });
}

export async function startInterviewService(
  userId: string,
  input: z.infer<typeof startInterviewSchema>
): Promise<AIInterviewStartResponse> {
  await checkQuota(userId);

  const mix = getQuestionMix(input.level);
  console.log(input);
  
  try {
    console.log("start interview func called ")
    const response = await aiInterviewClient.startInterview({
      user_id: userId,
      level: input.level,
      field: input.field,
      question_mix: mix,
    });
    console.log("response of start interview " , response)
    return response;
  } catch (error) {
    console.log(error);
    handleInterviewServiceError(error);
  }
}

export async function submitAnswerService(
  userId: string,
  input: z.infer<typeof answerSchema>
): Promise<AIInterviewAnswerResponse> {
  try {
    const response = await aiInterviewClient.submitAnswer(input.sessionId, {
      transcript: input.transcript,
    });
    if (response.status === "complete" || response.status === "awaiting_review") {
      await incrementQuota(userId);
    }
    return response;
  } catch (error) {
    handleInterviewServiceError(error);
  }
}

export async function retryReviewService(
  userId: string,
  sessionId: string
): Promise<AIInterviewTerminalResponse> {
  try {
    const response = await aiInterviewClient.retryReview(sessionId);
    return response;
  } catch (error) {
    handleInterviewServiceError(error);
  }
}

export async function getSessionService(
  userId: string,
  sessionId: string
): Promise<AIInterviewAnswerResponse> {
  try {
    const response = await aiInterviewClient.getSession(sessionId);
    return response;
  } catch (error) {
    handleInterviewServiceError(error);
  }
}

export function handleSpeechServiceError(error: unknown): never {
  if (error instanceof SpeechTimeoutError) {
    throw new TRPCError({
      code: "TIMEOUT",
      message: "Speech service request timed out.",
    });
  }

  if (error instanceof SpeechServiceError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Unknown speech error occurred",
  });
}

export async function textToSpeechService(
  text: string,
  voice?: string
): Promise<string> {
  try {
    const audioBuffer = await speechClient.textToSpeech(text, voice);
    return audioBuffer.toString("base64");
  } catch (error) {
    handleSpeechServiceError(error);
  }
}

export async function speechToTextService(
  fileBase64: string,
  fileName: string
): Promise<SpeechToTextResponse> {
  try {
    const buffer = Buffer.from(fileBase64, "base64");
    return await speechClient.speechToText(buffer, fileName);
  } catch (error) {
    handleSpeechServiceError(error);
  }
}

