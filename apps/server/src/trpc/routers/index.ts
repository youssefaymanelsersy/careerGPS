import { router } from "../index";
import { authRouter } from "../../modules/auth/routes/trpc_route";
import { cvRouter } from "../../modules/cv/routes/trpc_route";
import { githubRouter } from "../../modules/github/routes/trpc_route";
import { rolesRouter } from "../../modules/roles/routes/trpc_route";
import { skillsRouter } from "../../modules/skills/routes/trpc_route";
import { roadmapRouter } from "../../modules/roadmap/routes/roadmap_trpc";
import { readinessRouter } from "../../modules/roadmap/routes/readiness_trpc";

export const appRouter = router({
    auth: authRouter,
    cv: cvRouter,
    github: githubRouter,
    roles: rolesRouter,
    skills: skillsRouter,
    roadmap: roadmapRouter,
    readiness: readinessRouter,
});

export type AppRouter = typeof appRouter;

