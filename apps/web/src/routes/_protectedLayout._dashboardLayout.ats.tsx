import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircleIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAtsEvaluate, useRemainingAiQuota } from "@/features/dashboard/dashboard.service";
import { AtsUpload } from "@/features/dashboard/components/ats-upload";
import { AtsLoading } from "@/features/dashboard/components/ats-loading";
import { AtsResults } from "@/features/dashboard/components/ats-results";

export default function DashboardATS() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const { atsScore, data, isPending, isSuccess, reset } = useAtsEvaluate();
  const { data: quota, isLoading: isQuotaLoading } = useRemainingAiQuota("ats") as any;

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
    return <AtsResults data={data} onReset={handleReset} />;
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
              <CardDescription>You've used your free ATS scan for today</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            You get <strong>1 free scan</strong> per day. Your quota will reset on{" "}
            <strong>{quota.resetsOn}</strong>.
          </p>
          <p className="text-muted-foreground text-sm">
            After the reset you'll be able to scan again.
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
    return <AtsLoading fileName={fileName} />;
  }

  return (
    <div>
      {quota && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-surface-secondary px-4 py-3 text-sm">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            You have{" "}
            <strong className="text-foreground">{quota.remaining} free scan{quota.remaining !== 1 ? "s" : ""}</strong>{" "}
            remaining today
            {quota.remaining > 0 && (
              <> — resets on <strong>{quota.resetsOn}</strong></>
            )}
          </span>
        </div>
      )}
      <AtsUpload
        onSubmit={(data) => {
          if (data.file) setFileName(data.file.name);
          else setFileName("Existing CV");
          atsScore(data);
        }}
        disabled={isPending}
      />
    </div>
  );
}
