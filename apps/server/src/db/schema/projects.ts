import { pgTable, uuid, text, doublePrecision, timestamp , unique } from "drizzle-orm/pg-core";
import { user } from "../../modules/auth/db/schema";

export const projects = pgTable(
    "projects",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        title: text("title").notNull(),
        description: text("description"),
        source: text("source").notNull(),

        complexityScore: doublePrecision("complexity_score").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userTitleUnique: unique().on(table.userId, table.title),
    })
);