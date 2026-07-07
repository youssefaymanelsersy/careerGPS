import { z } from "zod";
import { syncGithubSkillsForUser } from "@/modules/skills/service";
import { protectedProcedure, router } from "@/trpc/index";
import { db } from "@/db";
import { githubStats, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const githubRouter = router({
    syncProjects: protectedProcedure
        .input(
            z.object({
                username: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return syncGithubSkillsForUser({
                userId: ctx.session.user.id,
                githubUsername: input.username,
            });
        }),

    getStats: protectedProcedure
        .query(async ({ ctx }) => {
            return db.query.githubStats.findFirst({
                where: eq(githubStats.userId, ctx.session.user.id)
            });
        }),
        
    getProjects: protectedProcedure
        .query(async ({ ctx }) => {
            return db.query.projects.findMany({
                where: eq(projects.userId, ctx.session.user.id),
                orderBy: desc(projects.complexityScore)
            });
        }),
        
    addManualProject: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            complexityLevel: z.enum(["simple", "moderate", "complex"])
        }))
        .mutation(async ({ ctx, input }) => {
            let score = 5;
            if (input.complexityLevel === "moderate") score = 15;
            if (input.complexityLevel === "complex") score = 30;
            
            return db.insert(projects).values({
                userId: ctx.session.user.id,
                title: input.title,
                description: input.description || "",
                source: "manual",
                complexityScore: score
            })
            .onConflictDoUpdate({
                target: [projects.userId, projects.title],
                set: {
                    description: input.description || "",
                    complexityScore: score
                }
            })
            .returning();
        }),
});

export default githubRouter;
