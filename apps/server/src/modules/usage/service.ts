import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { usageTracker } from "./db/schema";
import { user } from "@/db/schema";

const MAX_DAILY_USES = 1;

function getTodayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getTomorrowStart(): Date {
  const today = getTodayStart();
  return new Date(today.getTime() + 86400000);
}

export async function checkDailyQuota(userId: string, feature: string): Promise<void> {
  const today = getTodayStart();
  const existing = await db.query.usageTracker.findFirst({
    where: and(
      eq(usageTracker.userId, userId),
      eq(usageTracker.feature, feature),
      eq(usageTracker.date, today),
    ),
  });

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (currentUser?.systemRole === "admin") {
    return;
  }

  if (existing && existing.usesCount >= MAX_DAILY_USES) {
    const tomorrow = getTomorrowStart();
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Daily limit reached. Your quota resets on ${tomorrow.toISOString().slice(0, 10)}.`,
    });
  }
}

export async function incrementDailyQuota(userId: string, feature: string): Promise<void> {
  const today = getTodayStart();
  const existing = await db.query.usageTracker.findFirst({
    where: and(
      eq(usageTracker.userId, userId),
      eq(usageTracker.feature, feature),
      eq(usageTracker.date, today),
    ),
  });

  if (!existing) {
    await db.insert(usageTracker).values({
      userId,
      feature,
      usesCount: 1,
      date: today,
    });
    return;
  }

  await db
    .update(usageTracker)
    .set({ usesCount: existing.usesCount + 1 })
    .where(eq(usageTracker.id, existing.id));
}

export async function getRemainingDailyQuota(
  userId: string,
  feature: string,
): Promise<{ remaining: number; resetsOn: string }> {
  const today = getTodayStart();
  const tomorrow = getTomorrowStart();
  const resetsOn = tomorrow.toISOString().slice(0, 10);

  const existing = await db.query.usageTracker.findFirst({
    where: and(
      eq(usageTracker.userId, userId),
      eq(usageTracker.feature, feature),
      eq(usageTracker.date, today),
    ),
  });

  if (!existing) {
    return { remaining: MAX_DAILY_USES, resetsOn };
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (currentUser?.systemRole === "admin") {
    return { remaining: 9999, resetsOn };
  }

  const remaining = Math.max(0, MAX_DAILY_USES - existing.usesCount);
  return { remaining, resetsOn };
}
