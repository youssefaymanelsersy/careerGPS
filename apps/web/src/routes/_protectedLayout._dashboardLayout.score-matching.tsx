import { useState } from "react";
import { useScoreMatch, type ScoreMatchInput } from "@/features/dashboard/dashboard.service";
import { ScoreMatchingUpload } from "@/features/dashboard/components/score-matching-upload";
import { ScoreMatchingLoading } from "@/features/dashboard/components/score-matching-loading";
import { ScoreMatchingResults } from "@/features/dashboard/components/score-matching-results";

export default function DashboardScoreMatching() {
  const [fileName, setFileName] = useState<string | null>(null);
  const { scoreMatch, data, isPending, isSuccess, reset } = useScoreMatch();

  const handleReset = () => {
    setFileName(null);
    reset();
  };

  if (isSuccess && data) {
    return <ScoreMatchingResults data={data.match_result} onReset={handleReset} />;
  }

  if (isPending && fileName) {
    return <ScoreMatchingLoading fileName={fileName} />;
  }

  return (
    <ScoreMatchingUpload
      onSubmit={(input: ScoreMatchInput) => {
        if (input.file) setFileName(input.file.name);
        else setFileName("Existing CV");
        scoreMatch(input);
      }}
      disabled={isPending}
    />
  );
}
