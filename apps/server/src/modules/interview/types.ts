/**
 * AI Interview Service known contract response shapes.
 * Authoritative types - do not re-derive.
 */

// POST /start response
export interface AIInterviewStartResponse {
  session_id: string;
  turn_id: number;
  question: string;
  category: "technical" | "soft";
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  turns_done: number;
  total_questions: number;
  status: "in_progress";
}

// POST /session/{id}/answer response (mid-interview)
export interface AIInterviewNextQuestion {
  question: string;
  category: "technical" | "soft";
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface AIInterviewInProgressResponse {
  session_id: string;
  status: "in_progress";
  turns_done: number;
  total_questions: number;
  next_question: AIInterviewNextQuestion;
}

export interface AIInterviewReview {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skill_level: string;
  level_up_gaps: string[];
  generated_at: string; // iso8601
}

// POST /session/{id}/answer response (final turn)
export interface AIInterviewTerminalResponse {
  session_id: string;
  status: "complete" | "awaiting_review";
  turns_done: number;
  total_questions: number;
  review?: AIInterviewReview; // Usually present when status is 'complete'
}

export type AIInterviewAnswerResponse =
  | AIInterviewInProgressResponse
  | AIInterviewTerminalResponse;

// Request Payloads

export interface AIInterviewStartPayload {
  user_id: string;
  level: string;
  field: string;
  question_mix: {
    technical: number;
    soft: number;
  };
}

export interface AIInterviewAnswerPayload {
  transcript: string;
}

// Custom Errors

export class SessionNotFoundError extends Error {
  constructor(message: string = "AI Interview session not found") {
    super(message);
    this.name = "SessionNotFoundError";
  }
}

export class SessionTimeoutError extends Error {
  constructor(message: string = "AI Interview service request timed out") {
    super(message);
    this.name = "SessionTimeoutError";
  }
}

export class AIInterviewServiceError extends Error {
  constructor(message: string = "AI Interview service encountered an error") {
    super(message);
    this.name = "AIInterviewServiceError";
  }
}

export interface SpeechToTextResponse {
  transcript: string;
  mode: string;
  latency_ms: number;
}

export class SpeechServiceError extends Error {
  constructor(message: string = "Speech service encountered an error") {
    super(message);
    this.name = "SpeechServiceError";
  }
}

export class SpeechTimeoutError extends Error {
  constructor(message: string = "Speech service request timed out") {
    super(message);
    this.name = "SpeechTimeoutError";
  }
}


