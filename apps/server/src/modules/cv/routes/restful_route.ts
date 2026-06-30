import express  from "express";
import {Router} from "express";
import { upload } from "../multer";
import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { uploadToCloudinary , deleteFromCloudinary } from "@/shared/storage/cloudinary";
import {responseBodySchema} from '../parsedCv_schema';
import { eq } from "drizzle-orm"
import { db } from "@/db";
import {cv} from "@/db/schema";
import { randomUUID, type UUID } from "crypto";
import { parseCVData } from "../cv-parser";

const router : Router = express.Router();

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = (session as any).user.id ;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    (req as any).session = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}




router.post("/parse", requireAuth, upload.array("file"), async (req, res) => {
  
  const files = (req as any).files as Express.Multer.File[] ;
  if (!files || files.length === 0) return res.status(400).json({ error: "No file uploaded" });
  if (files.length > 1) return res.status(400).json({ error: "Only upload 1 file" });
  const file = files[0];

  const session = (req as any).session;
  const userId = (session as any)?.user?.id ?? (session as any)?.userId;

  let publicId : string | undefined ;
  let url : string | undefined ;
  const id : UUID = randomUUID();

  try{

      // 1 - upload cv to cloud
      const uploaded = await uploadToCloudinary(file.buffer as Buffer);
      url = uploaded.url ;
      publicId = uploaded.publicId ;

      // 2 - save the uploaded cv data in db
      await db.insert(cv).values({
        id,
        userId,
        fileUrl: url,
        publicId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        status: "pending"
      });

    

    // 3 - parse cv data 
    const parserBody = await parseCVData( id , url) ;
    
    //4 - validate parsed data 
    const validResponse = responseBodySchema.safeParse(parserBody);

    if (!validResponse.success) {
      console.warn("Invalid payload from parser service ", parserBody);

      await db
      .update(cv)
      .set({ status: "failed" })
      .where(eq(cv.id, id ));

      return res.status(500).json({ errorMessage: "Invalid payload from parser service " });
    }

    const cvData = validResponse.data ;
    const {cvId , status } = cvData ;
    
    if (status === "completed") {
      // try {
        const { parsedData } = cvData;
        await db
        .update(cv)
        .set({ parsedData: parsedData ?? null, status: "completed" })
        .where(eq(cv.id, cvId));
        return res.status(200).json({
          cvId: cvId ,
          status: status,
          parsedData: parsedData ,
        });
    } else if (status === "failed") {
        const { errorMessage } = cvData ;

        await db
        .update(cv)
        .set({ status: "failed", errorMessage: errorMessage ?? null })
        .where(eq(cv.id, cvId));
        
        await deleteFromCloudinary(publicId);

        return res.status(200).json({
          cvId: cvId ,
          status: status,
          errorMessage: errorMessage ,
        });
      
    }

  }catch(error){
    console.error(error);

    // cleanup cloudinary
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cleanupError) {
        console.error(cleanupError);
      }
    }

    // update db if row exists
    try {
      await db
        .update(cv)
        .set({
          status: "failed",
        })
        .where(eq(cv.id, id));
    } catch(error){console.error("cant update cv status in database:", error)}

    return res.status(500).json({
      error: "Failed to upload CV",
    });
  }

});
