import express  from "express";
import {Router} from "express";
import { upload } from "@/lib/multer";
import { auth } from "@/utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import { uploadToCloudinary } from "@/lib/cloudinary";
// import { env } from "@careergps/env/server"; 
// import { z } from "zod";
// import { ParsedCVDataSchema } from "@/schemas/parsedCv";
// import { eq } from "drizzle-orm"
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


export default router;
