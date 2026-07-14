import { env } from "@careergps/env/server";
import {
  type SpeechToTextResponse,
  SpeechServiceError,
  SpeechTimeoutError,
} from "./types";

/**
 * Speech Service Client
 * Handles HTTP requests to the standalone FastAPI Speech Service.
 */
export class SpeechClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number = 20000; // 20 seconds timeout for Speech Service

  constructor() {
    const url = env.SPEECH_SERVICE_URL;
    if (!url) {
      console.warn("SPEECH_SERVICE_URL is not set. Defaulting to http://localhost:8001");
    }
    this.baseUrl = url || "http://localhost:8001";
  }

  /**
   * Helper to perform fetch with standard timeout and error handling.
   * Thin and consistent in style with AIInterviewClient.
   */
  private async fetchWithTimeout(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new SpeechServiceError(
          `Speech service returned status ${response.status}: ${errorText}`
        );
      }

      return response;
    } catch (error) {
      if (error instanceof SpeechServiceError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new SpeechTimeoutError();
      }
      throw new SpeechServiceError(
        `Network error communicating with speech service: ${error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Synthesize text to speech (WAV).
   * Returns a Buffer containing the audio bytes.
   */
  public async textToSpeech(text: string, voice: string = "af_heart"): Promise<Buffer> {
    const response = await this.fetchWithTimeout("/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Transcribe recorded speech audio to text.
   * Accepts WebM, WAV, or other formats supported by Groq Whisper.
   */
  public async speechToText(
    audio: Buffer | Blob,
    filename: string = "audio.webm"
  ): Promise<SpeechToTextResponse> {
    const formData = new FormData();

    let fileObj: File;
    if (audio instanceof Blob) {
      fileObj = new File([audio], filename, { type: audio.type || "audio/webm" });
    } else {
      fileObj = new File([audio], filename, { type: "audio/webm" });
    }

    formData.append("file", fileObj);

    const response = await this.fetchWithTimeout("/stt", {
      method: "POST",
      body: formData,
    });

    return (await response.json()) as SpeechToTextResponse;
  }
}

// Export a singleton instance
export const speechClient = new SpeechClient();
