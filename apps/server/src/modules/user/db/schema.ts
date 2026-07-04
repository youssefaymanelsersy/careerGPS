import { roles } from "@/db/schema";
import { pgTable, text, timestamp, boolean, uuid, integer } from "drizzle-orm/pg-core";


export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    roleId: uuid("role_id")
        .references(() => roles.id, { onDelete: "set null" }),
    availableDaysPerWeek: integer("available_days_per_week"),
    availableHoursPerDay: integer("available_hours_per_day"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});