import { z } from "zod";
import { syncGithubSkillsForUser } from "@/modules/skills/service";
import { publicProcedure, router } from "@/trpc/index";
import { db } from "@/db";
import { githubStats, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const githubRouter = router({
    syncProjects: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                username: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            return syncGithubSkillsForUser({
                userId: input.userId,
                githubUsername: input.username,
            });
        }),

    getStats: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return db.query.githubStats.findFirst({
                where: eq(githubStats.userId, input.userId)
            });
        }),
        
    getProjects: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return db.query.projects.findMany({
                where: eq(projects.userId, input.userId),
                orderBy: desc(projects.complexityScore)
            });
        }),
        
    addManualProject: publicProcedure
        .input(z.object({
            userId: z.string(),
            title: z.string().min(1),
            description: z.string().optional(),
            complexityLevel: z.enum(["simple", "moderate", "complex"])
        }))
        .mutation(async ({ input }) => {
            let score = 5;
            if (input.complexityLevel === "moderate") score = 15;
            if (input.complexityLevel === "complex") score = 30;
            
            return db.insert(projects).values({
                userId: input.userId,
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
