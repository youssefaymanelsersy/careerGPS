import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Search, Shield, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "@tanstack/react-form";

export default function AdminRoles() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles, isLoading: isLoadingRoles } = useQuery(
    trpc.roles.getAllRoles.queryOptions({ includeScore: false })
  );

  const createRoleMutation = useMutation({
    ...trpc.roles.create.mutationOptions(),
    onSuccess: (newRole) => {
      toast.success("Role created successfully!");
      setIsAddOpen(false);
      queryClient.invalidateQueries(trpc.roles.getAllRoles.queryFilter());
      setSelectedRoleId(newRole.id);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create role");
    },
  });

  const addForm = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.title) {
        toast.error("Role title is required");
        return;
      }
      await createRoleMutation.mutateAsync({
        title: value.title,
        description: value.description,
      });
      addForm.reset();
    },
  });

  const filteredRoles = roles?.filter((role: any) =>
    role.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6">
      {/* LEFT PANE: Role Selector */}
      <Card className="w-1/3 flex flex-col h-full border-r bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Roles</CardTitle>
              <CardDescription>Manage application roles.</CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Job Role</DialogTitle>
                  <DialogDescription>
                    Create a new job role (e.g. Frontend Developer).
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addForm.handleSubmit();
                  }}
                  className="space-y-4 pt-4"
                >
                  <addForm.Field
                    name="title"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label>Role Title</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Fullstack Engineer"
                        />
                      </div>
                    )}
                  />
                  <addForm.Field
                    name="description"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Optional description of this role..."
                          rows={3}
                        />
                      </div>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addForm.state.isSubmitting || createRoleMutation.isPending}
                  >
                    {(addForm.state.isSubmitting || createRoleMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Role
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-2">
          {isLoadingRoles ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRoles?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">
              No roles found.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredRoles?.map((role: any) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    selectedRoleId === role.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  }`}
                >
                  {role.title}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT PANE: Role Skills Editor */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedRoleId ? (
          <RoleBuilder roleId={selectedRoleId} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col">
            <Shield className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a job role from the sidebar to manage its required skills.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect } from "react";

function RoleBuilder({ roleId }: { roleId: string }) {
  const queryClient = useQueryClient();
  const [searchSkill, setSearchSkill] = useState("");
  
  const { data: role, isLoading: isLoadingRole } = useQuery(
    trpc.roles.getRoleById.queryOptions({ roleId })
  );

  const { data: allSkills, isLoading: isLoadingSkills } = useQuery(
    trpc.skills.getAllSkills.queryOptions()
  );

  const updateSkillsMutation = useMutation({
    ...trpc.roles.updateSkills.mutationOptions(),
    onSuccess: () => {
      toast.success("Role skills updated successfully!");
      queryClient.invalidateQueries(trpc.roles.getRoleById.queryFilter({ roleId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role skills");
    },
  });

  // Local state for optimistic editing before saving
  const [assignedSkills, setAssignedSkills] = useState<Map<string, boolean>>(new Map());
  
  // Sync local state when role changes
  useEffect(() => {
    if (role && role.skills) {
      const map = new Map<string, boolean>();
      role.skills.forEach((s: any) => {
        if (s.skill) {
          map.set(s.skill.id, s.isCore);
        }
      });
      setAssignedSkills(map);
    }
  }, [role]);

  const toggleSkillAssignment = (skillId: string) => {
    const newMap = new Map(assignedSkills);
    if (newMap.has(skillId)) {
      newMap.delete(skillId);
    } else {
      newMap.set(skillId, false); // Default to optional
    }
    setAssignedSkills(newMap);
  };

  const toggleIsCore = (skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMap = new Map(assignedSkills);
    if (newMap.has(skillId)) {
      newMap.set(skillId, !newMap.get(skillId));
      setAssignedSkills(newMap);
    }
  };

  const handleSave = async () => {
    if (assignedSkills.size === 0) {
      toast.error("Role must have at least one skill");
      return;
    }

    const payload = Array.from(assignedSkills.entries()).map(([skillId, isCore]) => ({
      skillId,
      isCore,
    }));

    await updateSkillsMutation.mutateAsync({
      roleId,
      skills: payload,
    });
  };

  if (isLoadingRole || isLoadingSkills) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unassignedSkills = allSkills?.filter(
    (skill: any) => !assignedSkills.has(skill.id) && skill.name.toLowerCase().includes(searchSkill.toLowerCase())
  ) || [];

  const mappedSkills = allSkills?.filter((skill: any) => assignedSkills.has(skill.id)) || [];

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40">
        <div>
          <CardTitle className="text-2xl">{role?.title}</CardTitle>
          <CardDescription>
            {role?.description || "Configure the required and optional skills for this role."}
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={updateSkillsMutation.isPending}>
          {updateSkillsMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Skills Mapping
        </Button>
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Assigned Skills */}
        <div className="w-1/2 border-r flex flex-col h-full bg-background/50">
          <div className="p-4 border-b bg-muted/10">
            <h3 className="font-semibold text-sm flex justify-between items-center">
              Assigned Skills
              <Badge variant="foreground">{assignedSkills.size} skills</Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Skills required for this role.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mappedSkills.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-6 text-center">
                No skills assigned yet. Add skills from the right panel.
              </div>
            ) : (
              mappedSkills.map((skill: any) => {
                const isCore = assignedSkills.get(skill.id);
                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{skill.name}</span>
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => toggleIsCore(skill.id, e)}
                      >
                        <Switch checked={isCore} className="scale-75 origin-left" />
                        <span className="text-xs text-muted-foreground">
                          {isCore ? "Mandatory (Core)" : "Optional"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleSkillAssignment(skill.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Available Skills */}
        <div className="w-1/2 flex flex-col h-full">
          <div className="p-4 border-b bg-muted/10">
            <h3 className="font-semibold text-sm mb-2">Available Skills</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search master skills..."
                className="pl-8 h-9 text-sm"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-2">
              {unassignedSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground w-full text-center py-4">
                  No unassigned skills found.
                </p>
              ) : (
                unassignedSkills.map((skill: any) => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkillAssignment(skill.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border rounded-full text-xs font-medium transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {skill.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
