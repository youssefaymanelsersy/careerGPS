import { router, verifiedProcedure } from "@/trpc/index";
import {
  startInterviewSchema,
  answerSchema,
  sessionIdSchema,
  textToSpeechSchema,
  speechToTextSchema,
} from "./validation";
import {
  startInterviewService,
  submitAnswerService,
  retryReviewService,
  getSessionService,
  getRemainingInterviewsService,
  textToSpeechService,
  speechToTextService,
} from "./service";

export const interviewRouter = router({
  start: verifiedProcedure
    .input(startInterviewSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await startInterviewService(userId, input);
    }),

  answer: verifiedProcedure
    .input(answerSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await submitAnswerService(userId, input);
    }),

  retryReview: verifiedProcedure
    .input(sessionIdSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await retryReviewService(userId, input.sessionId);
    }),

  getSession: verifiedProcedure
    .input(sessionIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await getSessionService(userId, input.sessionId);
    }),

  getRemainingInterviews: verifiedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await getRemainingInterviewsService(userId);
    }),

  textToSpeech: verifiedProcedure
    .input(textToSpeechSchema)
    .mutation(async ({ input }) => {
      return await textToSpeechService(input.text, input.voice);
    }),

  speechToText: verifiedProcedure
    .input(speechToTextSchema)
    .mutation(async ({ input }) => {
      return await speechToTextService(input.fileBase64, input.fileName);
    }),
});

