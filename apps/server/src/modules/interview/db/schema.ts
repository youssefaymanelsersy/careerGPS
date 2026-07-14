import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/modules/user/db/schema";

/**
 * Tracks monthly interview usage per user.
 *
 * Design decisions:
 * - Calendar-month reset: `period_start` stores the first day of the current month (UTC).
 * - Quota is consumed immediately when `POST /start` succeeds, regardless of completion.
 * - No transcript or history storage — this is the only interview-related DB table for MVP.
 */
export const interviewUsage = pgTable(
  "interview_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    interviewsUsed: integer("interviews_used").notNull().default(0),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("interview_usage_user_id_idx").on(table.userId)],
);
