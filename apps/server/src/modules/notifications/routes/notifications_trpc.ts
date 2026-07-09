import { router, protectedProcedure } from "@/trpc/index";
import { db } from "@/db";
import { notifications, notificationPreferences, pushSubscriptions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const notificationsRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        return await db.query.notifications.findMany({
            where: eq(notifications.userId, ctx.session.user.id),
            orderBy: (notifications, { desc }) => [desc(notifications.createdAt)]
        });
    }),

    markRead: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await db.update(notifications)
                .set({ status: "read", readAt: new Date() })
                .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.session.user.id)));
            return { success: true };
        }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
        await db.update(notifications)
            .set({ status: "read", readAt: new Date() })
            .where(and(eq(notifications.userId, ctx.session.user.id), eq(notifications.status, "pending")));
        return { success: true };
    }),

    updatePreferences: protectedProcedure
        .input(z.object({
            category: z.enum(["reminders", "streaks", "milestones"]),
            channelInApp: z.boolean().optional(),
            channelEmail: z.boolean().optional(),
            channelPush: z.boolean().optional(),
            quietHoursStart: z.string().optional(),
            quietHoursEnd: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { category, ...updates } = input;
            
            // Check if exists
            const existing = await db.query.notificationPreferences.findFirst({
                where: and(
                    eq(notificationPreferences.userId, ctx.session.user.id),
                    eq(notificationPreferences.category, category)
                )
            });

            if (existing) {
                await db.update(notificationPreferences)
                    .set(updates)
                    .where(eq(notificationPreferences.id, existing.id));
            } else {
                await db.insert(notificationPreferences).values({
                    userId: ctx.session.user.id,
                    category,
                    ...updates
                });
            }

            return { success: true };
        }),

    registerPushSubscription: protectedProcedure
        .input(z.object({
            endpoint: z.string(),
            p256dh: z.string(),
            auth: z.string(),
            deviceLabel: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.pushSubscriptions.findFirst({
                where: and(
                    eq(pushSubscriptions.userId, ctx.session.user.id),
                    eq(pushSubscriptions.endpoint, input.endpoint)
                )
            });

            if (existing) {
                await db.update(pushSubscriptions)
                    .set({ p256dh: input.p256dh, auth: input.auth, deviceLabel: input.deviceLabel })
                    .where(eq(pushSubscriptions.id, existing.id));
            } else {
                await db.insert(pushSubscriptions).values({
                    userId: ctx.session.user.id,
                    ...input
                });
            }
            return { success: true };
        }),

    unregisterPushSubscription: protectedProcedure
        .input(z.object({ endpoint: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await db.delete(pushSubscriptions)
                .where(and(
                    eq(pushSubscriptions.userId, ctx.session.user.id),
                    eq(pushSubscriptions.endpoint, input.endpoint)
                ));
            return { success: true };
        })
});
