import express  from "express";
import {Router} from "express";
import { upload } from "../multer";
import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { uploadToCloudinary } from "@/shared/storage/cloudinary";
import { env } from "@careergps/env/server"; 
import { z } from "zod";
import { ParsedCVDataSchema } from "../parsedCv_schema";
import { eq } from "drizzle-orm"
import { db } from "@/db";
import {cv} from "@/db/schema";
import { randomUUID } from "crypto";
// import { sendCVToAITeam } from "@/services/cv-parser";

const router : Router = express.Router();

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers as any) });
    const userId = (session as any)?.user?.id ?? (session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    (req as any).session = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

router.post("/upload", requireAuth, upload.array("file"), async (req, res) => {
  try {
    const files = (req as any).files as Express.Multer.File[] ;
    if (!files || files.length === 0) return res.status(400).json({ error: "No file uploaded" });
    if (files.length > 1) return res.status(400).json({ error: "Only upload 1 file" });
    const file = files[0];

    const session = (req as any).session;
    const userId = (session as any)?.user?.id ?? (session as any)?.userId;

    const { url, publicId } = await uploadToCloudinary(file.buffer as Buffer);

    const id = randomUUID();
    await db.insert(cv).values({
      id,
      userId,
      fileUrl: url,
      publicId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      status: "pending",
    });

    // Fire-and-forget send to AI team
    // sendCVToAITeam(id, url).catch((err) => {
    //   console.error("[ai-team] Failed to send CV:", err);
    //   // cv-timeout job will mark as failed after threshold
    // });

    return res.status(201).json({ cvId: id, status: "pending" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
});


// Webhook endpoint for AI parsing results — use shared ParsedCVDataSchema
const WebhookBodySchema = z.discriminatedUnion("status", [
  z.object({
    cvId: z.string().uuid(),
    status: z.literal("completed"),
    parsedData: ParsedCVDataSchema,
  }),

  z.object({
    cvId: z.string().uuid(),
    status: z.literal("failed"),
    errorMessage: z.string(),
  }),
]);

router.post("/webhook", async (req, res) => {
  const secret = req.header("X-Api-Secret");
  if (!secret || secret !== env.AI_TEAM_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  let body: unknown = req.body;
  const parse = WebhookBodySchema.safeParse(body);
  
  if (!parse.success) {
    console.warn("Invalid webhook payload", body);
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { cvId, status } = parse.data;

  try {
    const rows = await db.select({ id: cv.id, status: cv.status }).from(cv).where(eq(cv.id, cvId));
    const row = rows[0];
    if (!row) {
      console.warn("Webhook received for unknown cvId:", cvId);
      return res.status(200).json({ received: true });
    }

    if (row.status === "completed" || row.status === "failed") {
      console.info("Duplicate webhook ignored for cvId:", cvId);
      return res.status(200).json({ received: true });
    }

    if (status === "completed") {
      try {
        const { parsedData } = parse.data;
        await db.update(cv).set({ parsedData: parsedData ?? null, status: "completed" }).where(eq(cv.id, cvId));
      } catch (err) {
        console.error("Failed to update CV after webhook (completed)", cvId, err);
        return res.status(200).json({ received: true });
      }
    } else if (status === "failed") {
      try {
        const { errorMessage } = parse.data;
        await db.update(cv).set({ status: "failed", errorMessage: errorMessage ?? null }).where(eq(cv.id, cvId));
      } catch (err) {
        console.error("Failed to update CV after webhook (failed)", cvId, err);
        return res.status(200).json({ received: true });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handling error", err);
    return res.status(200).json({ received: true });
  }
});
export default router;
