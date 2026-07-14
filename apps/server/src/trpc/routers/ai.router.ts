import { z } from "zod";
import { env } from "@careergps/env/server";
import { protectedProcedure, router } from "../index";
import {
  checkDailyQuota,
  incrementDailyQuota,
  getRemainingDailyQuota,
} from "@/modules/usage/service";

const atsScoreOutputSchema = z.object({
  scores: z.object({
    parseability_formatting: z.object({
      score: z.number(),
      max: z.number(),
      evidence: z.string(),
    }),
    section_structure: z.object({
      score: z.number(),
      max: z.number(),
      evidence: z.string(),
    }),
    content_quality: z.object({
      score: z.number(),
      max: z.number(),
      evidence: z.string(),
    }),
    keyword_optimization: z.object({
      score: z.number(),
      max: z.number(),
      evidence: z.string(),
    }),
  }),
  deductions: z.object({
    total: z.number(),
    reasons: z.string(),
  }),
  ats_report: z.object({
    has_multi_column_layout: z.boolean(),
    has_tables: z.boolean(),
    has_text_in_images: z.boolean(),
    is_scanned_pdf: z.boolean(),
    missing_sections: z.array(z.string()),
    contact_info_in_header_footer: z.boolean(),
    font_count: z.number(),
    page_count: z.number(),
    word_count: z.number(),
  }),
  key_strengths: z.array(z.string()),
  areas_for_improvement: z.array(z.string()),
  total_score: z.number(),
  total_max: z.number(),
});

const scoreMatchOutputSchema = z.object({
  match_result: z.object({
    match_analysis: z.string(),
    score_details: z.object({
      hard_skills_score: z.number(),
      experience_score: z.number(),
      soft_skills_score: z.number(),
      logistics_score: z.number(),
    }),
    total_score: z.number(),
    explanation: z.string(),
    key_matched_skills: z.array(z.string()),
    missing_skills: z.array(z.string()),
    recommendation: z.string(),
  }),
});

const scoreMatchInputSchema = z
  .object({
    fileBase64: z.string().min(1),
    fileName: z.string().min(1),
    jobDescription: z.string().optional(),
    jobDescriptionImage: z
      .object({
        base64: z.string().min(1),
        name: z.string().min(1),
      })
      .optional(),
  })
  .refine(
    (data) =>
      (data.jobDescription && data.jobDescription.trim().length > 0) ||
      !!data.jobDescriptionImage,
    {
      message:
        "Either jobDescription or jobDescriptionImage must be provided",
    },
  );

export const aiRouter = router({
  atsScore: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string().min(1),
        fileName: z.string().min(1),
      }),
    )
    .output(atsScoreOutputSchema)
    .mutation(async ({ input, ctx }) => {
      await checkDailyQuota(ctx.session.user.id, "ats");

      const buffer = Buffer.from(input.fileBase64, "base64");

      const formData = new FormData();
      const file = new File([buffer], input.fileName, {
        type: "application/pdf",
      });
      formData.set("file", file);

      const response = await fetch(env.AI_TEAM_ATS_URL, {
        method: "POST",
        headers: {
          "X-API-Key": env.HUGGING_FACE_CV_ATS_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        console.log(response);
        const errorText = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json() as unknown as z.output<typeof atsScoreOutputSchema>;
      await incrementDailyQuota(ctx.session.user.id, "ats");
      return data;
    }),

  scoreMatch: protectedProcedure
    .input(scoreMatchInputSchema)
    .output(scoreMatchOutputSchema)
    .mutation(async ({ input, ctx }) => {
      await checkDailyQuota(ctx.session.user.id, "skill_match");

      const buffer = Buffer.from(input.fileBase64, "base64");

      const formData = new FormData();
      const file = new File([buffer], input.fileName, {
        type: "application/pdf",
      });
      formData.set("cv_file", file);

      if (input.jobDescriptionImage) {
        const imgBuffer = Buffer.from(
          input.jobDescriptionImage.base64,
          "base64",
        );
        const ext = input.jobDescriptionImage.name.toLowerCase();
        const type = ext.endsWith(".png")
          ? "image/png"
          : ext.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg";
        const imgFile = new File([imgBuffer], input.jobDescriptionImage.name, {
          type,
        });
        formData.set("job_description_image", imgFile);
      } else {
        formData.set("job_description", input.jobDescription ?? "");
      }

      const response = await fetch(env.AI_TEAM_MATCHING_URL, {
        method: "POST",
        headers: {
          "X-API-Key": env.HUGGING_FACE_SKILL_MATCHING_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${errorText}`,
        );
      }

      const json = (await response.json()) as {
        match_result: z.output<typeof scoreMatchOutputSchema>["match_result"];
      };

      await incrementDailyQuota(ctx.session.user.id, "skill_match");
      return { match_result: json.match_result };
    }),

  getRemainingAiQuota: protectedProcedure
    .input(z.object({ feature: z.enum(["ats", "skill_match"]) }))
    .query(async ({ input, ctx }) => {
      return await getRemainingDailyQuota(ctx.session.user.id, input.feature);
    }),
});
