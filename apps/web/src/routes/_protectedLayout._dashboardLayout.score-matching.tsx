import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircleIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScoreMatch, useRemainingAiQuota, type ScoreMatchInput } from "@/features/dashboard/dashboard.service";
import { ScoreMatchingUpload } from "@/features/dashboard/components/score-matching-upload";
import { ScoreMatchingLoading } from "@/features/dashboard/components/score-matching-loading";
import { ScoreMatchingResults } from "@/features/dashboard/components/score-matching-results";

export default function DashboardScoreMatching() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const { scoreMatch, data, isPending, isSuccess, reset } = useScoreMatch();
  const { data: quota, isLoading: isQuotaLoading } = useRemainingAiQuota("skill_match") as any;

  const handleReset = () => {
    setFileName(null);
    reset();
  };

  if (isQuotaLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (isSuccess && data) {
    return <ScoreMatchingResults data={data.match_result} onReset={handleReset} />;
  }

  if (quota && quota.remaining <= 0) {
    return (
      <Card variant="secondary" className="mx-auto max-w-lg mt-12">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
              <AlertCircleIcon className="size-6 text-warning" />
            </div>
            <div>
              <CardTitle>Daily Limit Reached</CardTitle>
              <CardDescription>You've used your free skill match for today</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            You get <strong>1 free match</strong> per day. Your quota will reset on{" "}
            <strong>{quota.resetsOn}</strong>.
          </p>
          <p className="text-muted-foreground text-sm">
            After the reset you'll be able to match again.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isPending && fileName) {
    return <ScoreMatchingLoading fileName={fileName} />;
  }

  return (
    <div>
      {quota && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-surface-secondary px-4 py-3 text-sm">
          <TargetIcon className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            You have{" "}
            <strong className="text-foreground">{quota.remaining} free match{quota.remaining !== 1 ? "es" : ""}</strong>{" "}
            remaining today
            {quota.remaining > 0 && (
              <> — resets on <strong>{quota.resetsOn}</strong></>
            )}
          </span>
        </div>
      )}
      <ScoreMatchingUpload
        onSubmit={(input: ScoreMatchInput) => {
          if (input.file) setFileName(input.file.name);
          else setFileName("Existing CV");
          scoreMatch(input);
        }}
        disabled={isPending}
      />
    </div>
  );
}
