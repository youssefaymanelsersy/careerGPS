-- Task 4: Add interview_usage table for tracking monthly free interview quota per user.
-- Design decisions:
--   - Calendar-month reset: period_start stores the 1st of the current month (UTC).
--   - Quota is consumed immediately on a successful /start, regardless of interview completion.
--   - No transcript/history storage; this is the sole interview-related table for MVP.

CREATE TABLE "interview_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "interviews_used" integer NOT NULL DEFAULT 0,
  "period_start" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX "interview_usage_user_id_idx" ON "interview_usage" ("user_id");
