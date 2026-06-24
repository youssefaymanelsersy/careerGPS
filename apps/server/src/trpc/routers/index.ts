import { router } from "../index";
import { authRouter } from "../../modules/auth/routes/auth_route";
import { githubRouter } from "./github";
import { readinessRouter } from "./readiness";
import { roadmapRouter } from "./roadmap";
import { rolesRouter } from "./roles";
import { skillsRouter } from "./skills";
import { cvRouter } from "../../modules/cv/routes/trpc_route";

export const appRouter = router({
    auth: authRouter,
    github: githubRouter,
    readiness: readinessRouter,
    roadmap: roadmapRouter,
    roles: rolesRouter,
    skills: skillsRouter,
    cv: cvRouter,
});

export type AppRouter = typeof appRouter;
