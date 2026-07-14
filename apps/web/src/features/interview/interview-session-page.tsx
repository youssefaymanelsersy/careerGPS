import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { useGetSession, useSubmitAnswer } from "./interview.service";
import type { InterviewQA } from "./types";

function useTimer(minutes: number) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (isExpired) return;
    const id = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [isExpired]);

  const formatted = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
  const isLow = timeLeft > 0 && timeLeft <= 120;

  return { timeLeft, formatted, isExpired, isLow };
}

interface CurrentQuestion {
  text: string;
  category: string;
  difficulty: string;
  tags: string[];
}

export function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = (location.state as any)?.interviewData;

  const { data: sessionData, isLoading: isSessionLoading, isError: isSessionError } = useGetSession(sessionId!);
  const { submitAnswer, isPending: isSubmitting } = useSubmitAnswer();

  const [qaHistory, setQaHistory] = useState<InterviewQA[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sessionEnded, setSessionEnded] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCurrentQuestion({
        text: initialData.question,
        category: initialData.category,
        difficulty: initialData.difficulty,
        tags: initialData.tags ?? [],
      });
      setProgress({ done: initialData.turns_done ?? 0, total: initialData.total_questions ?? 10 });
    }
  }, []);

  useEffect(() => {
    if (!sessionData || initialData) return;

    if (sessionData.status === "in_progress" && sessionData.next_question) {
      setCurrentQuestion({
        text: sessionData.next_question.question,
        category: sessionData.next_question.category,
        difficulty: sessionData.next_question.difficulty,
        tags: sessionData.next_question.tags ?? [],
      });
      setProgress({ done: sessionData.turns_done, total: sessionData.total_questions });
    } else if (sessionData.status === "in_progress" && !sessionData.next_question) {
      setPageError("Session data is incomplete. Please try again.");
    } else {
      setSessionEnded(true);
      setReview(sessionData.review ?? null);
      setProgress({ done: sessionData.turns_done, total: sessionData.total_questions });
    }
  }, [sessionData]);

  const handleSubmit = async () => {
    if (!currentAnswer.trim() || !sessionId || isSubmitting) return;

    const qa: InterviewQA = {
      question: currentQuestion?.text ?? "",
      answer: currentAnswer,
      category: currentQuestion?.category ?? "",
      difficulty: currentQuestion?.difficulty ?? "",
    };

    try {
      const response = await submitAnswer({ sessionId, transcript: currentAnswer });

      setQaHistory((prev) => [...prev, qa]);
      setCurrentAnswer("");
      setPageError(null);

      if (response.status === "in_progress" && response.next_question) {
        setCurrentQuestion({
          text: response.next_question.question,
          category: response.next_question.category,
          difficulty: response.next_question.difficulty,
          tags: response.next_question.tags ?? [],
        });
        setProgress({ done: response.turns_done, total: response.total_questions });
      } else if (response.status === "in_progress" && !response.next_question) {
        setPageError("Unexpected response - missing next question.");
      } else {
        setSessionEnded(true);
        setReview(response.review ?? null);
        setProgress({ done: response.turns_done, total: response.total_questions });
      }
    } catch {
      setPageError("Failed to submit answer. Please try again.");
    }
  };

  const { formatted: timerDisplay, isExpired: isTimeUp, isLow: isTimerLow } = useTimer(30);
  const autoSubmittingRef = useRef(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const progressPercent = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  useEffect(() => {
    if (!isTimeUp || sessionEnded || autoSubmittingRef.current || !sessionId) return;

    autoSubmittingRef.current = true;
    setIsAutoSubmitting(true);

    (async () => {
      while (true) {
        try {
          const response = await submitAnswer({ sessionId, transcript: "i dont know" });

          if (response.status === "in_progress" && response.next_question) {
            setCurrentQuestion({
              text: response.next_question.question,
              category: response.next_question.category,
              difficulty: response.next_question.difficulty,
              tags: response.next_question.tags ?? [],
            });
            setProgress({ done: response.turns_done, total: response.total_questions });
          } else if (response.status === "in_progress" && !response.next_question) {
            setPageError("Unexpected response - missing next question.");
            break;
          } else {
            setSessionEnded(true);
            setReview(response.review ?? null);
            setProgress({ done: response.turns_done, total: response.total_questions });
            break;
          }
        } catch {
          setPageError("Failed to submit remaining answers automatically.");
          break;
        }
      }

      autoSubmittingRef.current = false;
      setIsAutoSubmitting(false);
    })();
  }, [isTimeUp, sessionEnded, sessionId]);

  if (!initialData && isSessionLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!initialData && (isSessionError || (!isSessionLoading && !sessionData))) {
    return (
      <div className="mx-auto max-w-lg mt-12">
        <Card variant="secondary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Session Not Found</CardTitle>
                <CardDescription>This interview session could not be loaded.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The session may have expired or you don't have access to it.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full" onClick={() => navigate("/interview")}>
              Back to Setup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Interview Results</h2>
              {review && (
                <Badge variant="secondary" size="lg" className="capitalize">
                  {review.skill_level}
                </Badge>
              )}
            </div>
              
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/interview")}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Setup
          </Button>
        </div>

        <Separator />

        {review && (
          <>
            <Surface variant="secondary" className="flex flex-col items-center gap-4 py-10 rounded-xl">
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-muted-foreground">Skill Level</span>
                <span className="text-4xl font-bold tracking-tight capitalize">{review.skill_level}</span>
                <span className="text-md font-normal leading-snug mt-2 max-w-xxl text-left">
                  {review.summary}
                </span>
              </div>
            </Surface>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="size-4 text-success" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="gap-2">
                    {review.strengths?.map((s, i) => (
                      <Item key={i} variant="secondary" size="sm" className="rounded-lg px-3 py-2.5 items-start">
                        <ItemMedia>
                          <CheckCircle className="size-4 text-success" />
                        </ItemMedia>
                        <ItemContent className="gap-0">
                          <ItemTitle className="text-sm font-normal leading-snug">{s}</ItemTitle>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>

              <Card className="border-warning/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="size-4 text-warning" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="gap-2">
                    {review.weaknesses?.map((w, i) => (
                      <Item key={i} variant="secondary" size="sm" className="rounded-lg px-3 py-2.5 items-start">
                        <ItemMedia>
                          <AlertTriangle className="size-4 text-warning" />
                        </ItemMedia>
                        <ItemContent className="gap-0">
                          <ItemTitle className="text-sm font-normal leading-snug">{w}</ItemTitle>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            </div>

            {review.level_up_gaps?.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    Growth Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="gap-2">
                    {review.level_up_gaps.map((g, i) => (
                      <Item key={i} variant="secondary" size="sm" className="rounded-lg px-3 py-2.5 items-start">
                        <ItemContent className="gap-0">
                          <ItemTitle className="text-sm font-normal leading-snug">{g}</ItemTitle>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="flex justify-center pb-4">
          <Button variant="outline" onClick={() => navigate("/interview")}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mock Interview</h1>
            <p className="text-muted-foreground mt-1">
              Answer each question to the best of your ability.
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium tabular-nums ${
            isTimeUp ? "bg-destructive/10 text-destructive" :
            isTimerLow ? "bg-warning/10 text-warning" :
            "bg-surface-secondary text-muted-foreground"
          }`}>
            <Clock className="size-4" />
            {isTimeUp ? "00:00" : timerDisplay}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">
            Question {progress.done + 1} of {progress.total}
          </span>
          <span className="text-muted-foreground">
            {progress.done} / {progress.total} answered
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {isAutoSubmitting && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          Time's up! Submitting remaining answers with "I don't know"...
        </div>
      )}

      {pageError && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {pageError}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-3">
            {currentQuestion?.category && (
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            )}
            {currentQuestion?.difficulty && (
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            )}
          </div>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {currentQuestion?.text}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        <label className="text-sm font-medium">Your Answer</label>
        <Textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Type your answer here..."
          className="min-h-32"
          disabled={isSubmitting || isAutoSubmitting}
        />
        {isAutoSubmitting ? (
          <Button size="lg" className="w-full" disabled>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Submitting remaining answers...
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!currentAnswer.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
