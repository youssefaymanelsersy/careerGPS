import { useState } from "react";
import { GitBranch, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StepperNext, StepperPrev } from "@/components/ui/stepper";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSyncGithub } from "@/features/onboarding/onboarding.service";
import type { SyncedSkill } from "@/features/onboarding/onboarding.types";

interface GithubStepProps {
  onSuccess: (skills: SyncedSkill[]) => void;
}

export function GithubStep({ onSuccess }: GithubStepProps) {
  const [username, setUsername] = useState("");
  const syncMutation = useSyncGithub() as any;

  const handleSync = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    const result = await syncMutation.mutateAsync({ username: trimmed });
    onSuccess(
      result.skills.map((s: { skillName: string; strength: number }) => ({
        skillName: s.skillName,
        strength: s.strength,
      })),
    );
  };

  if (syncMutation.isSuccess) {
    const data = syncMutation.data;
    return (
      <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            GitHub Synced!
          </CardTitle>
          <CardDescription className="text-center">
            We found your repositories and skills
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className="space-y-4 text-center flex flex-col justify-center">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
                <GitBranch className="size-6 text-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{data.repoCount}</p>
                <p className="text-sm text-muted-foreground">Repositories</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{data.skills.length}</p>
                <p className="text-sm text-muted-foreground">Skills Found</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
          <StepperNext render={<Button />}>Next Step</StepperNext>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
      <CardHeader>
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
            <GitBranch className="size-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">
          Link Your Github Profile
        </CardTitle>
        <CardDescription className="text-center">
          Please enter your github username
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <InputGroup variant="secondary" className="flex-1 h-14">
              <InputGroupAddon align="inline-start">
                <InputGroupText className=" text-base">https://github.com/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ps-0.5! h-full text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSync();
                }}
                disabled={syncMutation.isPending}
              />
            </InputGroup>
            <Button
              onClick={handleSync}
              disabled={!username.trim() || syncMutation.isPending}
              className="h-14 px-6 text-lg"
            >
              {syncMutation.isPending ? (
                <Spinner />
              ) : (
                "Sync"
              )}
            </Button>
          </div>
          <Alert variant="info" className="mt-4">
            <Info className="size-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              By continuing, you agree that CareerGPS may read your public Github data for skill extraction
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        {/* <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev> */}
        <StepperNext disabled={syncMutation.isPending} render={<Button />}>Skip</StepperNext>
      </CardFooter>
    </Card>
  );
}
