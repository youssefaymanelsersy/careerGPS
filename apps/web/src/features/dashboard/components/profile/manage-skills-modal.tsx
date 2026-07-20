"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
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
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export type SkillLevel = "beginner" | "intermediate" | "expert";
export const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "expert"];

export function strengthToLevel(strength: number): SkillLevel {
  if (strength >= 75) return "expert";
  if (strength >= 50) return "intermediate";
  return "beginner";
}

export function levelToStrength(level: SkillLevel): number {
  switch (level) {
    case "expert": return 75;
    case "intermediate": return 50;
    case "beginner": return 25;
  }
}

export interface ModalSkill {
  skillId?: string;
  skillName: string;
  level: SkillLevel;
}

interface ManageSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSkills: ModalSkill[];
  preserveSkills?: ModalSkill[];
  onSaved?: () => void;
  title?: string;
  description?: string;
}

export function ManageSkillsModal({
  isOpen,
  onClose,
  initialSkills,
  preserveSkills = [],
  onSaved,
  title = "Manage Your Skills",
  description = "Review, adjust levels, and add skills manually. Your roadmap will be automatically updated."
}: ManageSkillsModalProps) {
  const [skills, setSkills] = useState<ModalSkill[]>(initialSkills);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");

  const searchQuery = useSearchSkills(comboboxInputValue) as any;
  const bulkSaveMutation = useMutation({
    ...trpc.skills.bulkSaveUserSkills.mutationOptions({
      onSuccess: () => {
        toast.success("Skills saved and roadmaps synced successfully.");
        onSaved?.();
        onClose();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to save skills");
      }
    })
  });

  useEffect(() => {
    if (isOpen) {
      setSkills(initialSkills);
    }
  }, [isOpen, initialSkills]);

  const addSkill = useCallback(
    (name: string) => {
      setSkills((prev) => {
        const exists = prev.find(
          (s) => s.skillName.toLowerCase() === name.toLowerCase(),
        );
        if (exists) return prev;
        return [...prev, { skillName: name, level: selectedLevel }];
      });
      setComboboxInputValue("");
      setAddDialogOpen(false);
    },
    [selectedLevel],
  );

  const removeSkill = useCallback((name: string) => {
    setSkills((prev) => prev.filter((s) => s.skillName !== name));
  }, []);

  const handleLevelChange = useCallback((name: string, level: SkillLevel) => {
    setSkills((prev) => prev.map((s) => (s.skillName === name ? { ...s, level } : s)));
  }, []);

  const handleSave = () => {
    const allSkills = [...preserveSkills, ...skills];
    const payload = allSkills.map(s => ({
      skillId: s.skillId,
      skillName: s.skillName,
      strengthScore: levelToStrength(s.level)
    }));
    
    bulkSaveMutation.mutate(payload);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-7xl sm:max-w-5xl md:max-w-7xl h-[85vh] flex flex-col p-0 overflow-hidden bg-surface border-border">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-center text-2xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-center">{description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
            <div className="flex-1 min-h-0">
              {skills.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4">
                    <button
                      onClick={() => setAddDialogOpen(true)}
                      className="col-span-full w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" />
                      Add skill
                    </button>
                    {skills.map((skill) => (
                      <Card key={skill.skillName} size="sm">
                        <CardHeader>
                          <CardTitle className="text-xl! font-semibold break-words whitespace-normal">{skill.skillName}</CardTitle>
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
                  <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="size-4" />
                    Add skill
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-3 bg-background">
            <Button variant="outline" onClick={onClose} disabled={bulkSaveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={bulkSaveMutation.isPending}>
              {bulkSaveMutation.isPending ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
              Save & Sync Roadmaps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new skill</DialogTitle>
            <DialogDescription>Search and select a skill, then choose your level</DialogDescription>
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
    </>
  );
}
