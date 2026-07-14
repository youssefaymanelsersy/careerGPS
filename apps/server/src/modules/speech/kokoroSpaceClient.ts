/**
 * kokoroSpaceClient.ts
 *
 * Thin client for calling the hosted Kokoro-TTS Gradio Space
 * (https://huggingface.co/spaces/hexgrad/Kokoro-TTS) as a TTS backend.
 *
 * NOTE: this hits a public shared demo (ZeroGPU). Fine for prototyping
 * CareerGPS's interview feature; move to a self-hosted Kokoro-FastAPI
 * deployment before relying on it for real user traffic.
 */

const SPACE_BASE = "https://hexgrad-kokoro-tts.hf.space";
const FN_INDEX = 4; // index of the TTS generation function on this Space
const TRIGGER_ID = 2; // UI element id this Space expects for that function

interface GenerateOptions {
  voice?: string;
  speed?: number;
  trimSilence?: boolean;
  timeoutMs?: number;
}

interface QueueEvent {
  msg: string;
  event_id?: string | null;
  success?: boolean;
  title?: string | null;
  output?: {
    data: Array<
      | { path: string; url: string; orig_name: string; [key: string]: unknown }
      | string
    >;
  };
}

function randomSessionHash(length = 11): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Calls the hosted Kokoro-TTS Space and returns raw WAV audio bytes as a Buffer.
 * Throws an Error if the Space reports failure or the request times out.
 */
export async function generateSpeech(
  text: string,
  options: GenerateOptions = {},
): Promise<Buffer> {
  const {
    voice = "af_heart",
    speed = 1.0,
    trimSilence = true,
    timeoutMs = 60_000,
  } = options;

  const sessionHash = randomSessionHash();

  const payload = {
    data: [text, voice, speed, trimSilence],
    event_data: null,
    fn_index: FN_INDEX,
    trigger_id: TRIGGER_ID,
    session_hash: sessionHash,
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const joinResp = await fetch(`${SPACE_BASE}/gradio_api/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!joinResp.ok) {
      throw new Error(
        `queue/join failed: ${joinResp.status} ${joinResp.statusText}`,
      );
    }

    const streamUrl = `${SPACE_BASE}/gradio_api/queue/data?session_hash=${sessionHash}`;
    const streamResp = await fetch(streamUrl, { signal: controller.signal });
    if (!streamResp.ok || !streamResp.body) {
      throw new Error(
        `queue/data failed: ${streamResp.status} ${streamResp.statusText}`,
      );
    }

    const audioUrl = await parseSseForAudioUrl(streamResp.body);
    if (!audioUrl) {
      throw new Error("Kokoro Space did not return an audio URL");
    }

    const audioResp = await fetch(audioUrl, { signal: controller.signal });
    if (!audioResp.ok) {
      throw new Error(
        `Audio download failed: ${audioResp.status} ${audioResp.statusText}`,
      );
    }
    const arrayBuffer = await audioResp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function parseSseForAudioUrl(
  body: ReadableStream<Uint8Array>,
): Promise<string | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.slice("data:".length).trim();
        if (!jsonStr) continue;

        let event: QueueEvent;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        if (event.msg === "process_completed") {
          if (!event.success) {
            throw new Error(
              `Kokoro Space reported failure: ${event.title ?? "unknown error"}`,
            );
          }
          const first = event.output?.data?.[0];
          if (first && typeof first === "object" && "url" in first) {
            return first.url as string;
          }
          return null;
        }

        if (event.msg === "close_stream") {
          return null;
        }
      }
    }
    return null;
  } finally {
    reader.releaseLock();
  }
}
