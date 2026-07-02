import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/trpc/index";
import { db } from "@/db";
import { user } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const authRouter = router({
    createUser: publicProcedure
        .input(
            z.object({
                id: z.string().trim().min(1),
                name: z.string().trim().min(1),
                email: z.string().email(),
            })
        )
        .mutation(async ({ input }) => {
            const { id, name, email } = input;

            const inserted = await db
                .insert(user)
                .values({
                    id,
                    name,
                    email,
                    emailVerified: false,
                })
                .onConflictDoUpdate({
                    target: user.id,
                    set: {
                        name,
                        email,
                    },
                })
                .returning();

            const createdUser = inserted[0];
            if (!createdUser) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create user",
                });
            }

            return createdUser;
        }),

    updateRole: protectedProcedure
        .input(z.object({ roleId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const updated = await db
                .update(user)
                .set({ roleId: input.roleId })
                .where(eq(user.id, ctx.session.user.id))
                .returning();
            
            if (!updated[0]) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update user role",
                });
            }
            return updated[0];
        }),
});
