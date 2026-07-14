import { useState } from "react";
import { useAtsEvaluate } from "@/features/dashboard/dashboard.service";
import { AtsUpload } from "@/features/dashboard/components/ats-upload";
import { AtsLoading } from "@/features/dashboard/components/ats-loading";
import { AtsResults } from "@/features/dashboard/components/ats-results";

export default function DashboardATS() {
  const [fileName, setFileName] = useState<string | null>(null);
  const { atsScore, data, isPending, isSuccess, reset } = useAtsEvaluate();

  const handleReset = () => {
    setFileName(null);
    reset();
  };

  if (isSuccess && data) {
    return <AtsResults data={data} onReset={handleReset} />;
  }

  if (isPending && fileName) {
    return <AtsLoading fileName={fileName} />;
  }

  return (
    <AtsUpload
      onSubmit={(data) => {
        if (data.file) setFileName(data.file.name);
        else setFileName("Existing CV");
        atsScore(data);
      }}
      disabled={isPending}
    />
  );
}
