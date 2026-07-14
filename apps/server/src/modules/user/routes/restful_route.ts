import express from "express";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "@/shared/storage/cloudinary";
import { db } from "@/db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

router.post("/avatar", upload.single("image"), async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Clean up old Cloudinary image if it exists
    const oldImageUrl = session.user.image;
    if (oldImageUrl && oldImageUrl.includes("res.cloudinary.com")) {
      try {
        const parts = oldImageUrl.split("/upload/");
        if (parts.length === 2) {
          const path = parts[1];
          const withoutVersion = path.replace(/^v\d+\//, "");
          const publicId = withoutVersion.split(".").slice(0, -1).join(".");
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        }
      } catch (err) {
        console.error("Failed to delete old avatar from Cloudinary:", err);
      }
    }

    const uploaded = await uploadToCloudinary(req.file.buffer as Buffer, "avatars");
    
    // Update user in DB
    await db.update(user)
      .set({ image: uploaded.url })
      .where(eq(user.id, session.user.id));

    return res.status(200).json({
      success: true,
      url: uploaded.url,
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default router;
