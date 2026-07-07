import { useEffect, useState } from "react";
import { FileTextIcon } from "lucide-react";

const STAGES = [
  "Uploading resume...",
  "Parsing resume content...",
  "Analyzing section structure...",
  "Evaluating content quality...",
  "Checking formatting and parseability...",
  "Reviewing keyword optimization...",
  "Generating ATS compatibility report...",
];

interface AtsLoadingProps {
  fileName: string;
}

export function AtsLoading({ fileName }: AtsLoadingProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 2200);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = prev < 40 ? 3 : prev < 70 ? 1.5 : 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
        <FileTextIcon className="size-10 text-primary animate-pulse" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Analyzing Your Resume</h2>
        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {fileName}
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative h-6 overflow-hidden">
          {STAGES.map((stage, i) => (
            <p
              key={i}
              className={`absolute inset-0 text-center text-sm text-muted-foreground transition-all duration-500 ${
                i === stageIndex
                  ? "translate-y-0 opacity-100"
                  : i < stageIndex
                    ? "-translate-y-full opacity-0"
                    : "translate-y-full opacity-0"
              }`}
            >
              {stage}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
