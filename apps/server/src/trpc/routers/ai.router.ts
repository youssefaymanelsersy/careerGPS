import { z } from "zod";
import { env } from "@careergps/env/server";
import { protectedProcedure, router } from "../index";

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

export const aiRouter = router({
  atsScore: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string().min(1),
        fileName: z.string().min(1),
      }),
    )
    .output(atsScoreOutputSchema)
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");

      const formData = new FormData();
      const file = new File([buffer], input.fileName, {
        type: "application/pdf",
      });
      formData.set("file", file);

      const response = await fetch(
        "https://nourhan214-cv-ats.hf.space/evaluate",
        {
          method: "POST",
          headers: {
            "X-API-Key": env.HUGGING_FACE_CV_ATS_API_KEY,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${errorText}`,
        );
      }

      return response.json() as unknown as z.output<typeof atsScoreOutputSchema>;
    }),
});
