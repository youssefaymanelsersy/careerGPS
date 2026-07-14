import { useState } from "react";
import { useNavigate } from "react-router";
import { MicIcon, BriefcaseIcon, FileTextIcon, ClockIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemainingInterviews, useAllRoles, useStartInterview } from "../interview.service";
import { INTERVIEW_LEVELS } from "../types";
import type { InterviewType, InterviewLevel } from "../types";

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const { data: quota, isLoading: isQuotaLoading } = useRemainingInterviews() as any;
  const { data: roles, isLoading: isRolesLoading } = useAllRoles(false) as any;
  const { startInterview, isPending: isStarting } = useStartInterview() as any;

  const [interviewType, setInterviewType] = useState<InterviewType>("career");
  const [selectedCareer, setSelectedCareer] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [level, setLevel] = useState<InterviewLevel | "">("");
  const [jdTouched, setJdTouched] = useState(false);

  const isLoading = isQuotaLoading || isRolesLoading;

  const jdMinLength = 50;
  const jdMaxLength = 5000;
  const jdError = jdTouched && interviewType === "job_description" && jobDescription.length > 0 && jobDescription.length < jdMinLength
    ? `Job description must be at least ${jdMinLength} characters (${jdMinLength - jobDescription.length} more needed)`
    : null;

  const canStart = interviewType === "career"
    ? !!selectedCareer && !!level
    : !!jobDescription && jobDescription.length >= jdMinLength && !!level;

  const handleStart = async () => {
    if (!canStart || isStarting) return;

    const field = interviewType === "career" ? selectedCareer : jobDescription;
    try {
      const data = await startInterview({ level, field });
      navigate(`/interview/${data.session_id}`, { state: { interviewData: data } });
    } catch {
      // Toast is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
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
              <CardTitle>Monthly Limit Reached</CardTitle>
              <CardDescription>You've used all your free interviews this month</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            You get <strong>2 free interviews</strong> per month. Your quota will reset on{" "}
            <strong>{quota.resetsOn}</strong>.
          </p>
          <p className="text-muted-foreground text-sm">
            After the reset you'll be able to start new interview sessions.
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-muted-foreground mt-1">
          Practice with an AI-powered interview tailored to your career.
        </p>
      </div>

      {quota && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-surface-secondary px-4 py-3 text-sm">
          <MicIcon className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            You have{" "}
            <strong className="text-foreground">{quota.remaining} free interview{quota.remaining !== 1 ? "s" : ""}</strong>{" "}
            remaining this month
            {quota.remaining > 0 && (
              <> — resets on <strong>{quota.resetsOn}</strong></>
            )}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Setup Your Interview</CardTitle>
          <CardDescription>
            Choose your interview type, career focus, and experience level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Interview Type</Label>
            <Tabs value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
              <TabsList className="w-full">
                <TabsTrigger value="career" className="flex-1 gap-2">
                  <BriefcaseIcon className="size-4" />
                  Career Interview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="career" className="px-0">
                <div className="space-y-3">
                  <Label>Select Career</Label>
                  {roles && (
                    <Combobox
                      value={selectedCareer}
                      onValueChange={(v: string | null) => setSelectedCareer(v ?? "")}
                      inputValue={careerSearch}
                      onInputValueChange={setCareerSearch}
                    >
                      <ComboboxInput
                        showClear
                        placeholder="Search for a career..."
                      />
                      <ComboboxContent>
                        {roles.length > 0 ? (
                          <ComboboxList>
                            {roles.map((role: any) => (
                              <ComboboxItem key={role.id} value={role.title}>
                                {role.title}
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        ) : careerSearch.length >= 2 ? (
                          <ComboboxEmpty>No careers found</ComboboxEmpty>
                        ) : null}
                      </ComboboxContent>
                    </Combobox>
                  )}
                  {!selectedCareer && (
                    <p className="text-xs text-muted-foreground">
                      Select a career from the list to start your interview.
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="job_description" className="space-y-3 px-0">
                <Label htmlFor="jd">Paste Job Description</Label>
                <Textarea
                  id="jd"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  onBlur={() => setJdTouched(true)}
                  placeholder="Paste the full job description here..."
                  className="min-h-48"
                  aria-invalid={!!jdError}
                />
                <div className="flex items-center justify-between">
                  {jdError ? (
                    <p className="text-xs text-destructive">{jdError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Min {jdMinLength} characters
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {jobDescription.length} / {jdMaxLength}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label>Experience Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as InterviewLevel)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your level..." />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-surface-secondary px-4 py-3">
            <ClockIcon className="size-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">Estimated duration: </span>
              <strong>30 minutes</strong>
              <span className="text-muted-foreground"> — you'll answer questions one at a time</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart || isStarting}
            onClick={handleStart}
          >
            {isStarting ? "Starting..." : "Start Interview"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
