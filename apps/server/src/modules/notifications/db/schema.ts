import { pgTable, text, timestamp, boolean, uuid, jsonb, pgEnum, time } from "drizzle-orm/pg-core";
import { user } from "../../user/db/schema";
import { relations } from "drizzle-orm";

export const notificationTypeEnum = pgEnum("notification_type", [
  "session_reminder",
  "session_missed",
  "schedule_empty",
  "milestone_node_complete",
  "streak_at_risk",
  "streak_milestone",
  "streak_broken",
  "streak_frozen",
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["in_app", "push", "email"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "read", "dismissed", "failed"]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  payload: jsonb("payload"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationCategoryEnum = pgEnum("notification_category", ["reminders", "streaks", "milestones"]);

export const missedSessionAlerts = pgTable("missed_session_alerts", {
  eventId: uuid("event_id").primaryKey(),
  userId: text("user_id").notNull(),
  alertedAt: timestamp("alerted_at", { withTimezone: true }).defaultNow().notNull(),
});
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  category: notificationCategoryEnum("category").notNull(),
  channelInApp: boolean("channel_in_app").default(true).notNull(),
  channelEmail: boolean("channel_email").default(true).notNull(),
  channelPush: boolean("channel_push").default(true).notNull(),
  quietHoursStart: time("quiet_hours_start").default("22:00:00").notNull(),
  quietHoursEnd: time("quiet_hours_end").default("08:00:00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  deviceLabel: text("device_label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(user, {
    fields: [notificationPreferences.userId],
    references: [user.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(user, {
    fields: [pushSubscriptions.userId],
    references: [user.id],
  }),
}));
