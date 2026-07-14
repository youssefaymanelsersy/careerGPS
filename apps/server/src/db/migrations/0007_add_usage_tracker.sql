CREATE TABLE "usage_tracker" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "feature" text NOT NULL,
  "uses_count" integer NOT NULL DEFAULT 0,
  "date" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX "usage_tracker_user_feature_date_idx" ON "usage_tracker" ("user_id", "feature", "date");
