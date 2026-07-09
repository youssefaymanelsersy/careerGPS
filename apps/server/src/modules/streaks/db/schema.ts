import { pgTable, text, timestamp, integer, date } from "drizzle-orm/pg-core";
import { user } from "../../user/db/schema";
import { relations } from "drizzle-orm";

export const userStreaks = pgTable("user_streaks", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastResolvedDate: date("last_resolved_date"),
  freezesAvailable: integer("freezes_available").default(3).notNull(),
  freezesUsedThisMonth: integer("freezes_used_this_month").default(0).notNull(),
  freezeMonthAnchor: date("freeze_month_anchor"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(user, {
    fields: [userStreaks.userId],
    references: [user.id],
  }),
}));
