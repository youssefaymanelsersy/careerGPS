import { router, protectedProcedure } from "@/trpc/index";
import { settleStreak } from "../services/streak.service";

export const streaksRouter = router({
    get: protectedProcedure.query(async ({ ctx }) => {
        const today = new Date().toISOString().split("T")[0]!;
        // Call settleStreak lazily without incrementing
        const result = await settleStreak(ctx.session.user.id, today, false);
        return result;
    })
});
