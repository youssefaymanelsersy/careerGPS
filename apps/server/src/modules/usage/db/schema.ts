import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/modules/user/db/schema";

export const usageTracker = pgTable(
  "usage_tracker",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    usesCount: integer("uses_count").notNull().default(0),
    date: timestamp("date", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("usage_tracker_user_feature_date_idx").on(table.userId, table.feature, table.date),
  ],
);
