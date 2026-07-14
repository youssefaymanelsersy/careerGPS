import express, { Router } from "express";
import { auth } from "@/shared/auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import  {upload}  from "./multer";
import { generateSpeech } from "./kokoroSpaceClient";
import { generateSilentWav } from "./silentWav";
import { env } from "@careergps/env/server";

const router: Router = express.Router();

async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
    (req as any).session = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

const GROQ_API_KEY = env.GROQ_API_KEY;
const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// POST /speech/tts  { text: string, voice?: string }
router.post("/tts", requireAuth, express.json(), async (req, res) => {
  const text: string | undefined = req.body?.text?.trim();
  const voice: string = req.body?.voice ?? "af_heart";

  if (!text) {
    return res.status(400).json({ error: "Text cannot be empty" });
  }

  const start = Date.now();

  try {
    const wavBuffer = await generateSpeech(text, { voice });
    res.set({
      "Content-Type": "audio/wav",
      "X-Latency-Ms": (Date.now() - start).toFixed(2),
      "X-Speech-Mode": "hf-space",
    });
    return res.send(wavBuffer);
  } catch (err) {
    console.error("TTS generation failed:", err);
    const silentWav = generateSilentWav(1.5);
    res.set({
      "Content-Type": "audio/wav",
      "X-Latency-Ms": (Date.now() - start).toFixed(2),
      "X-Speech-Mode": "fallback-stub",
      "X-Error-Message": err instanceof Error ? err.message : String(err),
    });
    return res.send(silentWav);
  }
});

// POST /speech/stt  (multipart/form-data, field name "file")
router.post("/stt", requireAuth, upload.single("file"), async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const start = Date.now();

  if (!GROQ_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.json({
      transcript: "This is a mock transcript because GROQ_API_KEY is not set.",
      mode: "mock",
      latency_ms: Date.now() - start,
    });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype || "audio/webm",
    });
    formData.append("file", blob, file.originalname || "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");

    const groqResp = await fetch(GROQ_STT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      throw new Error(`Groq STT failed: ${groqResp.status} ${errText}`);
    }

    const result = (await groqResp.json()) as { text: string };
    return res.json({
      transcript: result.text,
      mode: "real",
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({
      error: `STT failed via Groq: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

export default router;
