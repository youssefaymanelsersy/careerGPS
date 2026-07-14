import { router, protectedProcedure } from "@/trpc/index";
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
  start: protectedProcedure
    .input(startInterviewSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await startInterviewService(userId, input);
    }),

  answer: protectedProcedure
    .input(answerSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await submitAnswerService(userId, input);
    }),

  retryReview: protectedProcedure
    .input(sessionIdSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await retryReviewService(userId, input.sessionId);
    }),

  getSession: protectedProcedure
    .input(sessionIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await getSessionService(userId, input.sessionId);
    }),

  getRemainingInterviews: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await getRemainingInterviewsService(userId);
    }),

  textToSpeech: protectedProcedure
    .input(textToSpeechSchema)
    .mutation(async ({ input }) => {
      return await textToSpeechService(input.text, input.voice);
    }),

  speechToText: protectedProcedure
    .input(speechToTextSchema)
    .mutation(async ({ input }) => {
      return await speechToTextService(input.fileBase64, input.fileName);
    }),
});

