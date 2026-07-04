import { pgTable, uuid, text, timestamp, boolean, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "../../user/db/schema";
import { roles } from "../../roles/db/schema";
import { skills } from "../../skills/db/schema";

export const roadmaps = pgTable("roadmaps", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),

    roleId: uuid("role_id")
        .notNull()
        .references(() => roles.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cachedInternalRoadmaps = pgTable("cached_internal_roadmaps", {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
        .notNull()
        .references(() => skills.id, { onDelete: "cascade" }),
    level: text("level").notNull(),
    durationDays: numeric("duration_days").notNull(),
    dailyMinutes: numeric("daily_minutes").notNull(),
    roadmapData: jsonb("roadmap_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    unq: uniqueIndex("cached_internal_roadmap_unq").on(table.skillId, table.level, table.durationDays, table.dailyMinutes)
}));

export const roadmapSteps = pgTable("roadmap_steps", {
    id: uuid("id").defaultRandom().primaryKey(),
    roadmapId: uuid("roadmap_id")
        .notNull()
        .references(() => roadmaps.id, { onDelete: "cascade" }),

    skillId: uuid("skill_id")
        .notNull()
        .references(() => skills.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description").notNull(),

    status: text("status").notNull().default("pending"),
    orderIndex: numeric("order_index").notNull(),

    cachedRoadmapId: uuid("cached_roadmap_id")
        .references(() => cachedInternalRoadmaps.id, { onDelete: "set null" }),

    completedAt: timestamp("completed_at"),
});

export const roadmapsRelations = relations(roadmaps, ({ many }) => ({
    steps: many(roadmapSteps),
}));

export const roadmapStepsRelations = relations(roadmapSteps, ({ one }) => ({
    roadmap: one(roadmaps, {
        fields: [roadmapSteps.roadmapId],
        references: [roadmaps.id],
    }),
    skill: one(skills, {
        fields: [roadmapSteps.skillId],
        references: [skills.id],
    }),
}));

export const skillGapResults = pgTable("skill_gap_results", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),

    roleId: uuid("role_id")
        .notNull()
        .references(() => roles.id, { onDelete: "cascade" }),

    missingSkills: jsonb("missing_skills").notNull(),
    matchScore: numeric("match_score").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readinessReports = pgTable("readiness_reports", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),

    roleId: uuid("role_id")
        .notNull()
        .references(() => roles.id, { onDelete: "cascade" }),

    skillMatchScore: numeric("skill_match_score").notNull(),
    generalGithubScore: numeric("general_github_score").notNull(),
    overallReadinessScore: numeric("overall_readiness_score").notNull(),

    feedback: text("feedback").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

