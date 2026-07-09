import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StepperNext, StepperPrev } from "@/components/ui/stepper";
import { FileUpload } from "@/components/ui/file-upload";
import { Spinner } from "@/components/ui/spinner";
import { useUploadCV } from "@/features/onboarding/onboarding.service";
import type { SyncedSkill } from "@/features/onboarding/onboarding.types";

interface CVStepProps {
  onSuccess: (skills: SyncedSkill[]) => void;
  onSkip: () => void;
}

export function CVStep({ onSuccess, onSkip }: CVStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadCV();

  const handleUpload = async () => {
    if (!file) return;

    const result = await uploadMutation.mutateAsync(file);
    onSuccess(
      result.skills.map((s) => ({
        skillName: s.skillName,
        strength: s.strength,
      })),
    );
  };

  if (uploadMutation.isSuccess) {
    const data = uploadMutation.data;
    return (
      <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
        <CardHeader>
          <div className="flex justify-center items-center">
            <div className="inline-flex w-fit items-center justify-center rounded-full bg-primary/10 p-4">
              <FileText className="size-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold">
            CV Parsed!
          </CardTitle>
          <CardDescription className="text-center">
            We extracted skills from your CV
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-4 text-center flex flex-col justify-center">
            <div className="flex justify-center">

            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold">{data.skills.length}</p>
              <p className="text-sm text-muted-foreground">Skills Extracted</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
          <StepperNext render={<Button disabled={uploadMutation.isPending && !!file} />}>Next</StepperNext>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Upload Your CV
        </CardTitle>
        <CardDescription className="text-center">
          Upload your CV to extract skills and experience (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          <FileUpload
            accept=".pdf"
            value={file}
            onChange={setFile}
            disabled={uploadMutation.isPending}
            icon={FileText}
            title="Drag & drop your CV"
            subtitle="PDF files only, up to 10MB"
          />

          {uploadMutation.isPending && file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>Parsing {file.name}...</span>
            </div>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!file}
              className="w-full"
            >
              Upload & Parse
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
        <StepperNext render={<Button disabled={uploadMutation.isPending && !!file} />}>Skip</StepperNext>
      </CardFooter>
    </Card>
  );
}
