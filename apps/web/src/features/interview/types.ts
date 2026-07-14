import type { RouterOutput } from "@/utils/trpc";

export type RemainingQuota = RouterOutput["interview"]["getRemainingInterviews"];
export type AllRoles = RouterOutput["roles"]["getAllRoles"];
export type Role = AllRoles[number];

export const INTERVIEW_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "manager_lead", label: "Manager / Lead" },
] as const;

export type InterviewLevel = (typeof INTERVIEW_LEVELS)[number]["value"];

export type InterviewType = "career" | "job_description";

// Session / answer types
export type InterviewStartResponse = RouterOutput["interview"]["start"];
export type InterviewInProgressResponse = Extract<
  RouterOutput["interview"]["getSession"],
  { status: "in_progress" }
>;
export type InterviewTerminalResponse = Extract<
  RouterOutput["interview"]["getSession"],
  { status: "complete" | "awaiting_review" }
>;

export interface InterviewQA {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}
