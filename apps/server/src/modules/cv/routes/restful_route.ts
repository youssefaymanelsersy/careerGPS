import express from "express";
import { Router } from "express";
import { upload } from "../multer";
import { requireVerifiedAuth } from "@/shared/auth/middlewares";
import { uploadToCloudinary, deleteFromCloudinary } from "@/shared/storage/cloudinary";
import { responseBodySchema } from '../parsedCv_schema';
import { eq } from "drizzle-orm"
import { db } from "@/db";
import { cv, skills } from "@/db/schema";
import { randomUUID, type UUID } from "crypto";
import { parseCVData } from "../cv-parser";
import { env } from "@careergps/env/server";
import { normalizeSkillName } from "@/modules/github/utils";

const router: Router = express.Router();

router.post("/parse", requireVerifiedAuth, upload.single("file"), async (req, res) => {

  const file = req.file as Express.Multer.File;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  

  const header = file.buffer.subarray(0, 5).toString("ascii");

  if (header !== "%PDF-") {
    return res.status(400).json({
      success: false,
      message: "Invalid PDF file.",
    });
  }
  const session = (req as any).session;
  const userId = session.user.id;

  let publicId: string | undefined;
  let url: string | undefined;
  const id: UUID = randomUUID();

  try {

    // 1 - upload cv to cloud
    const uploaded = await uploadToCloudinary(file.buffer as Buffer);
    url = uploaded.url;
    publicId = uploaded.publicId;

    // 3 - parse cv data
    const parserBody = await parseCVData(id, url);

    // 4 - validate parsed data
    const validResponse = responseBodySchema.safeParse(parserBody);

    if (!validResponse.success) {
      console.warn("Invalid payload from parser service", parserBody);
      console.error("\n the issues are : \n", validResponse.error.issues);
      await db.update(cv).set({ status: "failed" }).where(eq(cv.id, id));
      if (publicId) await deleteFromCloudinary(publicId);

      return res.status(500).json({ errorMessage: "Invalid payload from parser service" });
    }

    const cvData = validResponse.data;
    const { cvId, status } = cvData;

    if (cvId !== id) {
      console.warn("cvId mismatch from parser service", { sent: id, received: cvId, parserBody });
      if (publicId) await deleteFromCloudinary(publicId);
      return res.status(500).json({ errorMessage: "Invalid payload from parser service" });
    }

    if (status === "completed") {    

      const { parsedData } = cvData;
      const {technical} = parsedData.skills ;
   
      // 2 - save the uploaded cv data in db
      await db.insert(cv).values({
        id,
        userId,
        fileUrl: url,
        publicId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        status: "completed" ,
        parsedData: parsedData ?? null,
      });

      const allSkills = await db.select().from(skills);
      const skillsByNormalizedName = new Map<string, Array<typeof allSkills[0]>>();
      for (const skill of allSkills) {
          const key = normalizeSkillName(skill.name);
          const bucket = skillsByNormalizedName.get(key) ?? [];
          bucket.push(skill);
          skillsByNormalizedName.set(key, bucket);
      }

      const validSkills = [];
      for (const skill of technical) {
        const normalized = normalizeSkillName(skill.name);
        const matched = skillsByNormalizedName.get(normalized);
        if (matched && matched.length > 0) {
          let strength = 50;
          if (skill.level) {
            const l = skill.level.toLowerCase();
            if (l.includes("expert") || l.includes("advanced") || l.includes("senior") || l.includes("fluent") || l.includes("proficient")) strength = 75;
            else if (l.includes("intermediate") || l.includes("mid") || l.includes("working")) strength = 50;
            else if (l.includes("beginner") || l.includes("junior") || l.includes("basic") || l.includes("novice") || l.includes("familiar")) strength = 25;
          }
          validSkills.push({
            "skillName": matched[0]!.name,
            "strength": strength,
          });
        }
      }

      return res.status(200).json({
        cvId: id,
        status,
        "skills": validSkills,
      });

    } else if (status === "failed") {
      const { errorMessage } = cvData;

      if (publicId) await deleteFromCloudinary(publicId);

      console.log("ai parser error :",errorMessage);
      return res.status(500).json({ errorMessage: "ai service error" });


    } else {
      // exhaustive fallback - guarantees we never hang without a response
      console.error("Unhandled parser status", status, parserBody);

      if (publicId) await deleteFromCloudinary(publicId);

      return res.status(500).json({ error: "Unexpected status from parser service" });
    }

  } catch (error) {
    console.error(error);

    // cleanup cloudinary
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cleanupError) {
        console.error(cleanupError);
      }
    }
    return res.status(500).json({
      error: "Failed to upload CV",
    });
  }

});

router.post("/optimize", requireVerifiedAuth, upload.single("cv_file"), async (req, res) => {
  try {
    const file = req.file;
    const cvData = req.body.cv_data;
    const jobDescription = req.body.job_description;
    const designPreference = req.body.design_preference;

    const formData = new FormData();
    if (file) {
      formData.append("cv_file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    } else if (cvData) {
      formData.append("cv_data", cvData);
    }

    if (jobDescription) {
      formData.append("job_description", jobDescription);
    }
    if (designPreference) {
      formData.append("design_preference", designPreference);
    }

    const aiUrl = env.AI_MICROSERVICE_URL;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

    console.log(`Proxying optimize request to ${aiUrl}/optimize`);
    const aiRes = await fetch(`${aiUrl}/optimize`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!aiRes.ok) {
       const errorData = await aiRes.json().catch(() => ({}));
       return res.status(aiRes.status).json(errorData);
    }

    const data = await aiRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Optimize Proxy Error:", err);
    return res.status(500).json({ detail: "AI Service is unavailable or timed out." });
  }
});

export default router;