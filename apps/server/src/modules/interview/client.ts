import { env } from "@careergps/env/server";
import {
  type AIInterviewStartResponse,
  type AIInterviewAnswerResponse,
  type AIInterviewTerminalResponse,
  type AIInterviewReview,
  type AIInterviewStartPayload,
  type AIInterviewAnswerPayload,
  SessionNotFoundError,
  SessionTimeoutError,
  AIInterviewServiceError,
} from "./types";

/**
 * Raw session record returned by GET /session/{id} on the Railway service.
 * This endpoint returns the full session object, NOT the AnswerResponse shape
 * that /start and /answer use.
 */
interface RawSessionTurn {
  turn_id: number;
  category: "technical" | "soft";
  question: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  difficulty_delta: number;
  answer: string;
  answered_at: string | null;
}

interface RawSessionResponse {
  session_id: string;
  user_id: string;
  field: string;
  level: string;
  question_mix: Record<string, number>;
  status: string;
  starting_difficulty: number;
  current_difficulty: number;
  created_at: string;
  completed_at: string | null;
  turns: RawSessionTurn[];
  review: AIInterviewReview | null;
}

/**
 * AI Interview Service Client
 * Handles HTTP requests to the stateful FastAPI AI Interview Service.
 */
export class AIInterviewClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number = 45000; // 45 seconds

  constructor() {
    // URL configured via env var, must never be publicly reachable
    const url = env.AI_INTERVIEW_SERVICE_URL;
    if (!url) {
      console.warn("AI_INTERVIEW_SERVICE_URL is not set. Client will fail.");
    }
    this.baseUrl = url || "";
  }

  /**
   * Helper to perform fetch with standard timeout and error handling
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      console.log("base url", this.baseUrl)
      console.log("endpoint", endpoint)
      console.log(options)
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      console.log("response", response)

      if (response.status === 404) {
        throw new SessionNotFoundError();
      }

      if (!response.ok) {
        // Handle generic non-2xx errors
        const errorText = await response.text().catch(() => "Unknown error");
        throw new AIInterviewServiceError(
          `AI service returned status ${response.status}: ${errorText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof SessionNotFoundError || error instanceof AIInterviewServiceError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new SessionTimeoutError();
      }
      throw new AIInterviewServiceError(`Network error communicating with AI service: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Starts a new interview session
   * POST /start
   */
  public async startInterview(payload: AIInterviewStartPayload): Promise<AIInterviewStartResponse> {
    return this.fetchWithTimeout<AIInterviewStartResponse>("/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Submits an answer to the current session
   * POST /session/{id}/answer
   */
  public async submitAnswer(
    sessionId: string,
    payload: AIInterviewAnswerPayload
  ): Promise<AIInterviewAnswerResponse> {
    return this.fetchWithTimeout<AIInterviewAnswerResponse>(
      `/answer`,
      {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          answer: payload.transcript,
        }),
      }
    );
  }

  /**
   * Retries generating a review if the previous attempt failed
   * POST /session/{id}/retry-review
   */
  public async retryReview(
    sessionId: string
  ): Promise<AIInterviewTerminalResponse> {
    return this.fetchWithTimeout<AIInterviewTerminalResponse>(
      `/session/${sessionId}/retry-review`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Transforms the raw session record from GET /session/{id}
   * into the AIInterviewAnswerResponse shape that the rest of the
   * codebase expects.
   *
   * The Railway /session/{id} endpoint returns the full session object
   * (with a `turns` array and `question_mix`), while /start and /answer
   * return a flat AnswerResponse with `next_question` / `turns_done` etc.
   */
  private transformSessionResponse(
    raw: RawSessionResponse
  ): AIInterviewAnswerResponse {
    const totalQuestions = Object.values(raw.question_mix).reduce(
      (sum, count) => sum + count,
      0
    );
    const turnsAnswered = raw.turns.filter((t) => t.answer !== "").length;

    if (raw.status === "in_progress") {
      const pendingTurn = raw.turns.find((t) => t.answer === "");
      if (!pendingTurn) {
        throw new AIInterviewServiceError(
          `Session ${raw.session_id} is in_progress but has no unanswered turn.`
        );
      }

      return {
        session_id: raw.session_id,
        status: "in_progress",
        turns_done: turnsAnswered,
        total_questions: totalQuestions,
        next_question: {
          question: pendingTurn.question,
          category: pendingTurn.category,
          difficulty: pendingTurn.difficulty,
          tags: pendingTurn.tags,
        },
      };
    }

    return {
      session_id: raw.session_id,
      status: raw.status as "complete" | "awaiting_review",
      turns_done: turnsAnswered,
      total_questions: totalQuestions,
      review: raw.review ?? undefined,
    };
  }

  /**
   * Gets the current state of a session (for reconnect/refresh)
   * GET /session/{id}
   */
  public async getSession(
    sessionId: string
  ): Promise<AIInterviewAnswerResponse> {
    const raw = await this.fetchWithTimeout<RawSessionResponse>(
      `/session/${sessionId}`
    );
    return this.transformSessionResponse(raw);
  }
}

// Export a singleton instance
export const aiInterviewClient = new AIInterviewClient();
