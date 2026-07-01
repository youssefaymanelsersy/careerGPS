import { db } from "@/db";
import { cv } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@careergps/env/server";

<<<<<<< HEAD
export async function parseCVData(cvId: string, url: string): Promise<unknown> {
  try {
    // mark as parsing before sending

    // console.log("entered in parsing function");
    // console.log("CV ID", cvId);
    // console.log("url", url);
    await db
      .update(cv)
      .set({ status: "parsing" })
      .where(eq(cv.id, cvId));

    // console.log("cv marked as parsing", cvId);

    const parsingEndPoint = `${env.AI_TEAM_URL}/parse`;



    const body = JSON.stringify({
      cvId,
      url
    });

    const res = await fetch(parsingEndPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
    // console.log();
    // console.log("cv sent to AI team for parsing", cvId);
    // console.log();
    // console.log("### Body #### : ", body);
    // console.log();
    // console.log("&&& RES %%% : ", res);
    // console.log();


    if (!res.ok) {
      await db
        .update(cv)
        .set({ status: "failed" })
        .where(eq(cv.id, cvId));
      // console.log("cv marked as failed", cvId);
      throw new Error(`AI Team rejected request: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("parsing service failed:", error);
=======
export async function parseCVData(cvId: string, fileUrl: string) : Promise<unknown> {
  try{
    // mark as parsing before sending
    await db
    .update(cv)
    .set({ status: "parsing" })
    .where(eq(cv.id, cvId));

    const parsingEndPoint = `${env.AI_TEAM_URL}/parse`;

    const body = JSON.stringify({
      cvId,
      fileUrl,
    });

    const res = await fetch(parsingEndPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!res.ok) {
      await db
      .update(cv)
      .set({ status: "failed" })
      .where(eq(cv.id, cvId));
      throw new Error(`AI Team rejected request: ${res.status}`);
    }

    return await res.json() ;
    
  }catch(error){
    console.error("parsing service failed:" ,error);
>>>>>>> cc56ec0fffdf9ae0f78ecfeec939e7632c58e1ca
    await db
      .update(cv)
      .set({ status: "failed" })
      .where(eq(cv.id, cvId));
    throw error;
  }

<<<<<<< HEAD
=======


  // return parsedData ;
>>>>>>> cc56ec0fffdf9ae0f78ecfeec939e7632c58e1ca
}

export default parseCVData;
