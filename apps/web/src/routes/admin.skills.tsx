import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AdminSkills() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useQuery(trpc.skills.getAllSkills.queryOptions());
  
  const createSkillMutation = useMutation({
    ...trpc.skills.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Skill created successfully!");
      setIsAddModalOpen(false);
      queryClient.invalidateQueries(trpc.skills.getAllSkills.queryFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create skill");
    },
  });

  const updateSkillMutation = useMutation({
    ...trpc.skills.updateSkill.mutationOptions(),
    onSuccess: () => {
      toast.success("Skill updated successfully!");
      setEditingSkill(null);
      queryClient.invalidateQueries(trpc.skills.getAllSkills.queryFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update skill");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      hasNoDependencies: true,
      dependencyIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (!value.name) {
        toast.error("Skill name is required");
        return;
      }
      await createSkillMutation.mutateAsync([
        {
          name: value.name,
          hasNoDependencies: value.hasNoDependencies,
          dependencyIds: value.dependencyIds,
        },
      ]);
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: editingSkill?.name || "",
      hasNoDependencies: editingSkill?.hasNoDependencies ?? true,
      dependencyIds: [] as string[],
      githubKeywords: editingSkill?.githubKeywords?.join(", ") || "",
    },
    onSubmit: async ({ value }) => {
      if (!editingSkill) return;
      if (!value.name) {
        toast.error("Skill name is required");
        return;
      }
      
      const keywordsArray = value.githubKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      await updateSkillMutation.mutateAsync({
        id: editingSkill.id,
        name: value.name,
        hasNoDependencies: value.hasNoDependencies,
        dependencyIds: value.dependencyIds,
        githubKeywords: keywordsArray,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Skills Dictionary</h2>
          <p className="text-muted-foreground mt-2">
            Manage the master list of skills and their dependencies.
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger>
            <Button>
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Add Skill
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Master Skill</DialogTitle>
              <DialogDescription>
                Create a new skill in the master dictionary.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4 pt-4"
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Skill Name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. React.js"
                    />
                  </div>
                )}
              />

              <form.Field
                name="hasNoDependencies"
                children={(field) => (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Root Skill</Label>
                        <p className="text-sm text-muted-foreground">
                          Check if this skill has no prerequisites.
                        </p>
                      </div>
                      <Switch
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                    </div>
                    
                    {!field.state.value && (
                      <form.Field
                        name="dependencyIds"
                        children={(depField) => (
                          <div className="space-y-2">
                            <Label>Dependencies</Label>
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                              {skills?.map((s: any) => (
                                <label key={s.id} className="flex items-center gap-2 text-sm">
                                  <input 
                                    type="checkbox" 
                                    checked={depField.state.value.includes(s.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        depField.handleChange([...depField.state.value, s.id]);
                                      } else {
                                        depField.handleChange(depField.state.value.filter((id: string) => id !== s.id));
                                      }
                                    }}
                                  />
                                  {s.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      />
                    )}
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.state.isSubmitting || createSkillMutation.isPending}
              >
                {(form.state.isSubmitting || createSkillMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Skill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-background border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill Name</TableHead>
              <TableHead>Normalized Name</TableHead>
              <TableHead>Root Skill</TableHead>
              <TableHead>GitHub Keywords</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading skills...
                </TableCell>
              </TableRow>
            ) : skills?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No skills found. Add your first skill!
                </TableCell>
              </TableRow>
            ) : (
              skills?.map((skill: any) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell className="text-muted-foreground">{skill.normalizedName}</TableCell>
                  <TableCell>
                    {skill.hasNoDependencies ? (
                      <Badge variant="primary">Root</Badge>
                    ) : (
                      <Badge variant="foreground">Dependent</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {skill.githubKeywords?.join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSkill(skill);
                        editForm.setFieldValue("name", skill.name);
                        editForm.setFieldValue("hasNoDependencies", skill.hasNoDependencies);
                        editForm.setFieldValue("githubKeywords", skill.githubKeywords?.join(", ") || "");
                      }}
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingSkill}
        onOpenChange={(open) => {
          if (!open) setEditingSkill(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <editForm.Field
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={`edit-${field.name}`}>Skill Name</Label>
                  <Input
                    id={`edit-${field.name}`}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            
            <editForm.Field
              name="hasNoDependencies"
              children={(field) => (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Root Skill</Label>
                      <p className="text-sm text-muted-foreground">
                        Check if this skill has no prerequisites.
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                  
                  {!field.state.value && (
                    <editForm.Field
                      name="dependencyIds"
                      children={(depField) => (
                        <div className="space-y-2">
                          <Label>Dependencies</Label>
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                            {skills?.filter((s: any) => s.id !== editingSkill?.id).map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 text-sm">
                                <input 
                                  type="checkbox" 
                                  checked={depField.state.value.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      depField.handleChange([...depField.state.value, s.id]);
                                    } else {
                                      depField.handleChange(depField.state.value.filter((id: string) => id !== s.id));
                                    }
                                  }}
                                />
                                {s.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
              )}
            />

            <editForm.Field
              name="githubKeywords"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={`edit-${field.name}`}>GitHub Keywords (Comma-separated)</Label>
                  <Input
                    id={`edit-${field.name}`}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. react, hooks, frontend"
                  />
                </div>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={editForm.state.isSubmitting || updateSkillMutation.isPending}
            >
              {(editForm.state.isSubmitting || updateSkillMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
