import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import {
  useAddManualSkills,
  useGenerateRoadmap,
  useSetAvailability,
  useSetUserRole,
} from "@/features/onboarding/onboarding.service";
import { GithubStep } from "@/features/onboarding/components/ui/github-step";
import { CVStep } from "@/features/onboarding/components/ui/cv-step";
import { SkillsStep } from "@/features/onboarding/components/ui/skills-step";
import { TimeStep } from "@/features/onboarding/components/ui/time-step";
import { CareerStep } from "@/features/onboarding/components/ui/career-step";
import {
  type SyncedSkill,
  type OnboardingSkill,
  levelToStrength,
} from "@/features/onboarding/onboarding.types";

const STEPS = ["GitHub", "CV", "Skills", "Time", "Career"];
const STEP_VALUES = ["step-0", "step-1", "step-2", "step-3", "step-4"];

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(STEP_VALUES[0]);
  const navigate = useNavigate();

  const [githubSkills, setGithubSkills] = useState<SyncedSkill[]>([]);
  const [cvSkills, setCvSkills] = useState<SyncedSkill[]>([]);

  const skillsRef = useRef<OnboardingSkill[]>([]);
  const hoursRef = useRef(4);
  const daysRef = useRef(5);
  const roleRef = useRef<string | null>(null);
  const setSkillsState = useCallback((skills: OnboardingSkill[]) => {
    skillsRef.current = skills;
  }, []);

  const handleGithubSuccess = useCallback((skills: SyncedSkill[]) => {
    setGithubSkills(skills);
  }, []);

  const handleCVSuccess = useCallback((skills: SyncedSkill[]) => {
    setCvSkills(skills);
  }, []);

  const handleCVSkip = useCallback(() => {
    setCvSkills([]);
    setCurrentStep("step-2");
  }, []);

  const handleSkillsComplete = useCallback((skills: OnboardingSkill[]) => {
    setSkillsState(skills);
  }, [setSkillsState]);

  const handleTimeComplete = useCallback(
    (hoursPerDay: number, daysPerWeek: number) => {
      hoursRef.current = hoursPerDay;
      daysRef.current = daysPerWeek;
    },
    [],
  );

  const handleCareerSelect = useCallback(
    (roleId: string) => {
      roleRef.current = roleId;
    },
    [],
  );

  const handleValidate = useCallback(
    (targetValue: string, direction: "next" | "prev") => {
      if (direction === "prev") return true;

      const targetIndex = STEP_VALUES.indexOf(targetValue);

      for (let i = 0; i < targetIndex; i++) {
        if (i === 1) continue;
        if (i === 3 && (hoursRef.current < 1 || daysRef.current < 1)) return false;
      }

      return true;
    },
    [],
  );

  const addManualSkillsMutation = useAddManualSkills() as any;
  const setAvailabilityMutation = useSetAvailability() as any;
  const setUserRoleMutation = useSetUserRole() as any;
  const generateRoadmapMutation = useGenerateRoadmap() as any;
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = useCallback(async () => {
    const skills = skillsRef.current;
    const hoursPerDay = hoursRef.current;
    const daysPerWeek = daysRef.current;
    const roleId = roleRef.current;

    if (!roleId) {
      toast.error("Please select a career path");
      return;
    }

    setSubmitting(true);
    try {
      if (skills.length > 0) {
        await addManualSkillsMutation.mutateAsync(
          skills.map((s) => ({
            skillName: s.skillName,
            strength: levelToStrength(s.level),
          })),
        );
      }

      await setAvailabilityMutation.mutateAsync({
        availableDaysPerWeek: daysPerWeek,
        availableHoursPerDay: hoursPerDay,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      await setUserRoleMutation.mutateAsync({ roleId });

      await generateRoadmapMutation.mutateAsync({ roleId });

      await authClient.updateUser({ isOnboarded: true });

      await authClient.$store.atoms.session.get().refetch();

      toast.success("Onboarding complete!");
      navigate("/roadmap", { replace: true });
    } catch (error) {
      toast.error("Failed to complete onboarding");
      setSubmitting(false);
    }
  }, [addManualSkillsMutation, generateRoadmapMutation, setAvailabilityMutation, setUserRoleMutation, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Stepper value={currentStep} onValueChange={setCurrentStep} onValidate={handleValidate}>
          <StepperList>
            {STEPS.map((title, i) => (
              <StepperItem key={STEP_VALUES[i]} value={STEP_VALUES[i]}>
                <StepperTrigger>
                  <StepperIndicator />
                  <StepperTitle>{title}</StepperTitle>
                </StepperTrigger>
                {i < STEPS.length - 1 && <StepperSeparator />}
              </StepperItem>
            ))}
          </StepperList>

          <StepperContent value="step-0">
            <GithubStep onSuccess={handleGithubSuccess} />
          </StepperContent>

          <StepperContent value="step-1">
            <CVStep onSuccess={handleCVSuccess} onSkip={handleCVSkip} />
          </StepperContent>

          <StepperContent value="step-2">
            <SkillsStep
              githubSkills={githubSkills}
              cvSkills={cvSkills}
              onComplete={handleSkillsComplete}
            />
          </StepperContent>

          <StepperContent value="step-3">
            <TimeStep
              initialHours={4}
              initialDays={5}
              onComplete={handleTimeComplete}
            />
          </StepperContent>

          <StepperContent value="step-4">
            <CareerStep
              onComplete={handleCareerSelect}
              onFinish={handleFinish}
              isFinishing={submitting}
            />
          </StepperContent>
        </Stepper>
      </div>
    </div>
  );
}
