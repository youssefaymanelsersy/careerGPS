"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepperNext, StepperPrev } from "@/components/ui/stepper";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { useSearchSkills } from "@/features/onboarding/onboarding.service";
import {
  type SyncedSkill,
  type OnboardingSkill,
  type SkillLevel,
  SKILL_LEVELS,
  mergeAndDedupeSkills,
  strengthToLevel,
} from "@/features/onboarding/onboarding.types";

interface SkillsStepProps {
  githubSkills: SyncedSkill[];
  cvSkills: SyncedSkill[];
  onComplete: (skills: OnboardingSkill[]) => void;
}

export function SkillsStep({ githubSkills, cvSkills, onComplete }: SkillsStepProps) {
  const mergedSkills = useMemo(
    () => mergeAndDedupeSkills(githubSkills, cvSkills),
    [githubSkills, cvSkills],
  );

  const [skills, setSkills] = useState<OnboardingSkill[]>(() =>
    mergedSkills.map((s) => ({
      skillName: s.skillName,
      level: strengthToLevel(s.strength),
    })),
  );

  useEffect(() => {
    onComplete(skills);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");

  const searchQuery = useSearchSkills(comboboxInputValue) as any;

  const addSkill = useCallback(
    (name: string) => {
      setSkills((prev) => {
        const exists = prev.find(
          (s) => s.skillName.toLowerCase() === name.toLowerCase(),
        );
        if (exists) return prev;

        const next = [...prev, { skillName: name, level: selectedLevel }];
        onComplete(next);
        return next;
      });
      setComboboxInputValue("");
      setDialogOpen(false);
    },
    [selectedLevel, onComplete],
  );

  const removeSkill = useCallback(
    (name: string) => {
      setSkills((prev) => {
        const next = prev.filter((s) => s.skillName !== name);
        onComplete(next);
        return next;
      });
    },
    [onComplete],
  );

  const handleLevelChange = useCallback(
    (name: string, level: SkillLevel) => {
      setSkills((prev) => {
        const next = prev.map((s) =>
          s.skillName === name ? { ...s, level } : s,
        );
        onComplete(next);
        return next;
      });
    },
    [onComplete],
  );

  return (
    <Card className="w-full max-w-2xl mx-auto h-125 flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Your Skills
        </CardTitle>
        <CardDescription className="text-center">
          Review, adjust levels, and add skills manually
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          {skills.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="col-span-1 md:col-span-2 lg:col-span-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Plus className="size-4" />
                  Add skill
                </button>
                {skills.map((skill) => (
                  <Card key={skill.skillName} size="sm">
                    <CardHeader>
                      <CardTitle className="text-xl! font-semibold">{skill.skillName}</CardTitle>
                      <CardAction>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSkill(skill.skillName)}
                        >
                          <X className="size-4" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardFooter>
                      <ToggleGroup
                        value={[skill.level]}
                        className="w-full"
                        orientation="vertical"
                        onValueChange={(values: string[]) => {
                          if (values[0]) {
                            handleLevelChange(skill.skillName, values[0] as SkillLevel);
                          }
                        }}
                        spacing={0}
                      >
                        {SKILL_LEVELS.map((level) => (
                          <ToggleGroupItem className="w-full" key={level} value={level}>
                            <span className="capitalize">{level}</span>
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </CardFooter>
                  </Card>
                ))}

              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <p className="text-center text-muted-foreground text-sm">
                No skills found. Add skills manually.
              </p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Add skill
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
        <StepperNext render={<Button />}>Next Step</StepperNext>
      </CardFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new skill</DialogTitle>
            <DialogDescription>
              Search and select a skill, then choose your level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Combobox
              value=""
              onValueChange={(value) => {
                if (value) {
                  addSkill(value);
                }
              }}
              inputValue={comboboxInputValue}
              onInputValueChange={setComboboxInputValue}
            >
              <ComboboxInput showClear placeholder="Search skills..." />
              <ComboboxContent>
                {searchQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : searchQuery.data && searchQuery.data.length > 0 ? (
                  <ComboboxList>
                    {searchQuery.data.map((skill: { id: string; name: string }) => (
                      <ComboboxItem key={skill.id} value={skill.name}>
                        {skill.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                ) : comboboxInputValue.length >= 2 ? (
                  <ComboboxEmpty>No skills found</ComboboxEmpty>
                ) : null}
              </ComboboxContent>
            </Combobox>
            <div className="space-y-2">
              <p className="text-sm font-medium">Level</p>
              <ToggleGroup
                value={[selectedLevel]}
                onValueChange={(values: string[]) => {
                  if (values[0]) {
                    setSelectedLevel(values[0] as SkillLevel);
                  }
                }}
                spacing={0}
              >
                {SKILL_LEVELS.map((level) => (
                  <ToggleGroupItem key={level} value={level}>
                    <span className="capitalize">{level}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
