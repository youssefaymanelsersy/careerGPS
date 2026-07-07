import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
  FileTextIcon,
  TypeIcon,
  PaletteIcon,
  LayoutListIcon,
  XCircleIcon,
} from "lucide-react";
import type { AtsEvaluation } from "../types";

const SCORE_LABELS: Record<string, string> = {
  parseability_formatting: "Parseability & Formatting",
  section_structure: "Section Structure",
  content_quality: "Content Quality",
  keyword_optimization: "Keyword Optimization",
};

interface AtsResultsProps {
  data: AtsEvaluation;
  onReset: () => void;
}

type ScoreTier = "success" | "warning" | "destructive";

const GRADE_BADGE_VARIANT: Record<ScoreTier, "success" | "warning" | "destructive"> = {
  success: "success",
  warning: "warning",
  destructive: "destructive",
};

const SCORE_TEXT_CLASS: Record<ScoreTier, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const SCORE_BG_CLASS: Record<ScoreTier, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const SCORE_STROKE_CLASS: Record<ScoreTier, string> = {
  success: "stroke-success",
  warning: "stroke-warning",
  destructive: "stroke-destructive",
};

const SCORE_BORDER_L_CLASS: Record<ScoreTier, string> = {
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

function scoreTier(percentage: number): ScoreTier {
  if (percentage >= 80) return "success";
  if (percentage >= 60) return "warning";
  return "destructive";
}

function gradeLabel(percentage: number) {
  if (percentage >= 85) return "Excellent";
  if (percentage >= 70) return "Strong Match";
  if (percentage >= 55) return "Good";
  if (percentage >= 40) return "Needs Work";
  return "Poor";
}

function ScoreRing({
  score,
  max,
  size = 170,
}: {
  score: number;
  max: number;
  size?: number;
}) {
  const percentage = (score / max) * 100;
  const radius = (size - 14) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const tier = scoreTier(percentage);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${SCORE_STROKE_CLASS[tier]} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold tracking-tight ${SCORE_TEXT_CLASS[tier]}`}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

function ScoreBar({
  score,
  max,
}: {
  score: number;
  max: number;
}) {
  const pct = Math.round((score / max) * 100);
  const tier = scoreTier(pct);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${SCORE_BG_CLASS[tier]} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums min-w-[3ch] text-right">
        {pct}%
      </span>
    </div>
  );
}

export function AtsResults({ data, onReset }: AtsResultsProps) {
  const scoreEntries = Object.entries(data.scores);
  const percentage = Math.round((data.total_score / data.total_max) * 100);
  const grade = gradeLabel(percentage);
  const tier = scoreTier(percentage);

  const statIcons = [
    { icon: FileTextIcon, label: "Pages", value: data.ats_report.page_count },
    {
      icon: TypeIcon,
      label: "Words",
      value: data.ats_report.word_count.toLocaleString(),
    },
    { icon: PaletteIcon, label: "Fonts Used", value: data.ats_report.font_count },
    {
      icon: LayoutListIcon,
      label: "Missing Sections",
      value: data.ats_report.missing_sections.length,
      tint:
        data.ats_report.missing_sections.length > 0
          ? ("text-warning" as const)
          : ("text-success" as const),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">ATS Evaluation Results</h2>
            <Badge variant={GRADE_BADGE_VARIANT[tier]} size="lg">
              {grade}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Your resume scored {percentage}% on ATS compatibility
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcwIcon className="size-4 mr-2" />
          Evaluate Another
        </Button>
      </div>

      <Separator />

      <Surface variant="secondary" className="flex flex-col items-center gap-4 py-10 rounded-xl">
        <ScoreRing score={data.total_score} max={data.total_max} />
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {percentage >= 80
            ? "Your resume is well-optimized for most ATS systems."
            : percentage >= 55
              ? "Your resume passes most ATS checks but has room for improvement."
              : "Your resume may be rejected by many ATS systems. Significant improvements needed."}
        </p>
      </Surface>

      <div>
        <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {scoreEntries.map(([key, cat]) => {
            const pct = Math.round((cat.score / cat.max) * 100);
            const t = scoreTier(pct);
            return (
              <Card key={key} className={SCORE_BORDER_L_CLASS[t]}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {SCORE_LABELS[key] ?? key}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-bold ${SCORE_TEXT_CLASS[t]}`}>
                      {cat.score}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {cat.max} pts
                    </span>
                  </div>
                  <ScoreBar score={cat.score} max={cat.max} />
                  <Separator />
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {cat.evidence}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {data.deductions.total > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangleIcon className="size-4" />
              Deductions &mdash; {data.deductions.total} pts lost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.deductions.reasons}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircleIcon className="size-4 text-success" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.key_strengths.map((strength, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-surface-secondary px-3 py-2.5 text-sm"
                >
                  <CheckCircleIcon className="size-4 text-success mt-0.5 shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-warning" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.areas_for_improvement.map((area, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-surface-secondary px-3 py-2.5 text-sm"
                >
                  <AlertTriangleIcon className="size-4 text-warning mt-0.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium">ATS Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statIcons.map(({ icon: Icon, label, value, tint }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-lg bg-surface-secondary py-4"
              >
                <Icon className={`size-5 text-muted-foreground ${tint ?? ""}`} />
                <span className={`text-xl font-bold ${tint ?? ""}`}>{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {data.ats_report.missing_sections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Missing Sections
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.ats_report.missing_sections.map((section) => (
                  <Badge key={section} variant="warning" size="sm">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Layout Analysis
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FlagIndicator
                label="Multi-Column"
                value={data.ats_report.has_multi_column_layout}
                warn
              />
              <FlagIndicator
                label="Has Tables"
                value={data.ats_report.has_tables}
                warn
              />
              <FlagIndicator
                label="Text in Images"
                value={data.ats_report.has_text_in_images}
                warn
              />
              <FlagIndicator
                label="Scanned PDF"
                value={data.ats_report.is_scanned_pdf}
                warn
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pb-4">
        <Button variant="outline" onClick={onReset}>
          <RotateCcwIcon className="size-4 mr-2" />
          Evaluate Another Resume
        </Button>
      </div>
    </div>
  );
}

function FlagIndicator({
  label,
  value,
  warn,
}: {
  label: string;
  value: boolean;
  warn?: boolean;
}) {
  if (value && warn) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
        <XCircleIcon className="size-4 text-destructive shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-surface-secondary px-3 py-2.5">
      <CheckCircleIcon className="size-4 text-success shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
