import { router, protectedProcedure } from "@/trpc/index";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { user, roadmaps, roles, cv, session, account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { deleteFromCloudinary } from "@/shared/storage/cloudinary";


export const userRouter = router({
    getUserInfo: protectedProcedure
        .query(async ({ ctx }) => {
            const userInfo = await db.query.user.findFirst({
                where: eq(user.id, ctx.session.user.id)
            });

            if (!userInfo) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }

            return userInfo;
        }),

    setAvailability : protectedProcedure
    .input(
        z.object({
            availableDaysPerWeek: z.number().min(1).max(7).optional(),
            availableHoursPerDay: z.number().min(1).max(24).optional(),
            availableWeekdays: z.array(z.number().min(0).max(6)).optional(),
            preferredStartTime: z.string().optional(),
            timezone: z.string().optional(),
        })
    )
    .mutation(async ({input , ctx}) => {
        const userId = ctx.session.user.id;
        const { availableDaysPerWeek, availableHoursPerDay, availableWeekdays, preferredStartTime, timezone } = input;

        const [updatedUser] = await db
          .update(user)
          .set({ availableDaysPerWeek, availableHoursPerDay, availableWeekdays, preferredStartTime, timezone })
          .where(eq(user.id, userId))
          .returning();

        if (!updatedUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        return updatedUser;
    }),

    getUserRoleInfo: protectedProcedure
        .query(async ({ ctx }) => {
            const activeRoadmap = await db.query.roadmaps.findFirst({
                where: and(
                    eq(roadmaps.userId, ctx.session.user.id),
                    eq(roadmaps.isActive, true)
                )
            });

            if (!activeRoadmap) {
                throw new TRPCError({ code: "NOT_FOUND", message: "No active roadmap found" });
            }

            const role = await db.query.roles.findFirst({
                where: eq(roles.id, activeRoadmap.roleId)
            });

            if (!role) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
            }

            return role;
        }),

    heartbeat: protectedProcedure
        .mutation(async ({ ctx }) => {
            const userId = ctx.session.user.id;
            await db.update(user)
                .set({ lastSeenAt: new Date() })
                .where(eq(user.id, userId));
            return { success: true };
        }),

    deleteAccount: protectedProcedure
        .mutation(async ({ ctx }) => {
            const userId = ctx.session.user.id;
            
            const userInfo = await db.query.user.findFirst({
                where: eq(user.id, userId),
            });

            if (!userInfo) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }

            // 1. Delete Avatar from Cloudinary
            const oldImageUrl = userInfo.image;
            if (oldImageUrl && oldImageUrl.includes("res.cloudinary.com")) {
                try {
                    const parts = oldImageUrl.split("/upload/");
                    if (parts.length === 2) {
                        const path = parts[1]!;
                        const withoutVersion = path.replace(/^v\d+\//, "");
                        const publicId = withoutVersion.split(".").slice(0, -1).join(".");
                        if (publicId) {
                            await deleteFromCloudinary(publicId);
                        }
                    }
                } catch (err) {
                    console.error("Failed to delete avatar from Cloudinary during account deletion:", err);
                }
            }

            // 2. Delete CVs from Cloudinary
            const userCVs = await db.query.cv.findMany({
                where: eq(cv.userId, userId),
            });
            
            for (const userCv of userCVs) {
                if (userCv.publicId) {
                    try {
                        await deleteFromCloudinary(userCv.publicId);
                    } catch (err) {
                        console.error(`Failed to delete CV ${userCv.publicId} from Cloudinary:`, err);
                    }
                }
            }

            // 3. Delete session and account (just in case cascade fails or schema wasn't migrated)
            await db.delete(session).where(eq(session.userId, userId));
            await db.delete(account).where(eq(account.userId, userId));

            // 4. Delete user row from database (Cascades to all related tables)
            await db.delete(user).where(eq(user.id, userId));

            return { success: true };
        })
});