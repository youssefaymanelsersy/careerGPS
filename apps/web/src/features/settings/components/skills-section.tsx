import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManageSkillsModal, strengthToLevel, levelToStrength, SKILL_LEVELS, type SkillLevel, type ModalSkill } from "@/features/dashboard/components/profile/manage-skills-modal";
import { Save, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useSearchSkills } from "@/features/onboarding/onboarding.service";

export function SkillsSection() {
  const queryClient = useQueryClient();
  const { data: userSkills, isLoading } = useQuery({
    ...trpc.skills.getUserSkills.queryOptions()
  });

  const [skills, setSkills] = useState<ModalSkill[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");

  const searchQuery = useSearchSkills(comboboxInputValue) as any;

  useEffect(() => {
    if (userSkills && !hasChanges) {
      setSkills(userSkills.map((s: any) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        level: strengthToLevel(Number(s.strengthScore)),
      })));
    }
  }, [userSkills, hasChanges]);

  const bulkSaveMutation = useMutation({
    ...trpc.skills.bulkSaveUserSkills.mutationOptions({
      onSuccess: () => {
        toast.success("Skills saved and roadmaps synced successfully.");
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: trpc.skills.getUserSkills.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.readiness.getLatestReport.queryKey() } as any);
        queryClient.invalidateQueries({ queryKey: trpc.roadmap.getActiveRoadmap.queryKey() } as any);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to save skills");
      }
    })
  });

  const handleSave = () => {
    const payload = skills.map(s => ({
      skillId: s.skillId,
      skillName: s.skillName,
      strengthScore: levelToStrength(s.level)
    }));
    bulkSaveMutation.mutate(payload);
  };

  const addSkill = useCallback(
    (name: string) => {
      setSkills((prev) => {
        const exists = prev.find((s) => s.skillName.toLowerCase() === name.toLowerCase());
        if (exists) return prev;
        setHasChanges(true);
        return [...prev, { skillName: name, level: selectedLevel }];
      });
      setComboboxInputValue("");
      setAddDialogOpen(false);
    },
    [selectedLevel],
  );

  const removeSkill = useCallback((name: string) => {
    setSkills((prev) => prev.filter((s) => s.skillName !== name));
    setHasChanges(true);
  }, []);

  const handleLevelChange = useCallback((name: string, level: SkillLevel) => {
    setSkills((prev) => prev.map((s) => (s.skillName === name ? { ...s, level } : s)));
    setHasChanges(true);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Manage your technical skills. Adding, removing, or changing skill levels here will automatically sync across all your roadmaps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        <Button variant="ghost" size="icon" onClick={() => removeSkill(skill.skillName)}>
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
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4 gap-3">
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={() => {
                 setHasChanges(false);
                 if (userSkills) {
                   setSkills(userSkills.map((s: any) => ({
                     skillId: s.skillId,
                     skillName: s.skillName,
                     level: strengthToLevel(Number(s.strengthScore)),
                   })));
                 }
              }}
              disabled={bulkSaveMutation.isPending}
            >
              Discard Changes
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={isLoading || !hasChanges || bulkSaveMutation.isPending}
          >
            {bulkSaveMutation.isPending ? <Spinner className="mr-2" /> : <Save className="mr-2 size-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>

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
