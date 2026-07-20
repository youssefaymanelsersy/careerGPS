import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, Edit, BookOpen, Link2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function AdminCurriculum() {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: skills, isLoading: isLoadingSkills } = useQuery(
    trpc.skills.getAllSkills.queryOptions()
  );

  const filteredSkills = skills?.filter((skill: any) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6">
      {/* LEFT PANE: Skill Selector */}
      <Card className="w-1/3 flex flex-col h-full border-r bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle>Skills</CardTitle>
          <CardDescription>Select a skill to edit its curriculum.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-2">
          {isLoadingSkills ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSkills?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">
              No skills found.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredSkills?.map((skill: any) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    selectedSkillId === skill.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  }`}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT PANE: Curriculum Editor */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedSkillId ? (
          <CurriculumEditor skillId={selectedSkillId} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col">
            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a skill from the sidebar to manage its curriculum.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function CurriculumEditor({ skillId }: { skillId: string }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);

  const { data: nodes, isLoading } = useQuery(
    trpc.curriculum.getCurriculumNodes.queryOptions({ skillId })
  );

  const deleteNodeMutation = useMutation({
    ...trpc.curriculum.deleteCurriculumNode.mutationOptions(),
    onSuccess: () => {
      toast.success("Node deleted");
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete node");
    },
  });

  const reorderNodeMutation = useMutation({
    ...trpc.curriculum.reorderCurriculumNode.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reorder node");
    },
  });

  const addNodesMutation = useMutation({
    ...trpc.curriculum.addCurriculumNodesForSkill.mutationOptions(),
    onSuccess: () => {
      toast.success("Node added successfully");
      setIsAddOpen(false);
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add node");
    },
  });

  const updateNodeMutation = useMutation({
    ...trpc.curriculum.updateCurriculumNode.mutationOptions(),
    onSuccess: () => {
      toast.success("Node updated successfully");
      setEditingNode(null);
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update node");
    },
  });

  const addForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      estimatedDurationHours: 2,
    },
    onSubmit: async ({ value }) => {
      if (!value.title) {
        toast.error("Title is required");
        return;
      }
      await addNodesMutation.mutateAsync([
        {
          skillId,
          nodes: [
            {
              orderIndex: nodes ? nodes.length : 0,
              title: value.title,
              description: value.description,
              estimatedDurationHours: value.estimatedDurationHours,
            },
          ],
        },
      ]);
      addForm.reset();
    },
  });

  const editForm = useForm({
    defaultValues: {
      title: editingNode?.title || "",
      description: editingNode?.description || "",
      estimatedDurationHours: editingNode?.estimatedDurationHours || 2,
    },
    onSubmit: async ({ value }) => {
      if (!value.title) {
        toast.error("Title is required");
        return;
      }
      if (!editingNode) return;

      await updateNodeMutation.mutateAsync({
        id: editingNode.id,
        title: value.title,
        description: value.description,
        estimatedDurationHours: value.estimatedDurationHours,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40">
        <div>
          <CardTitle>Curriculum Nodes</CardTitle>
          <CardDescription>
            Step-by-step learning path for this skill.
          </CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <Button size="sm">
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Add Node
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Curriculum Node</DialogTitle>
              <DialogDescription>
                Create a new learning step. It will be added to the end of the path.
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
                    <Label>Title</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Introduction to Variables"
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
                      placeholder="What will the user learn here?"
                      rows={3}
                    />
                  </div>
                )}
              />
              <addForm.Field
                name="estimatedDurationHours"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Estimated Duration (Hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={addForm.state.isSubmitting || addNodesMutation.isPending}
              >
                {(addForm.state.isSubmitting || addNodesMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Node
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {(!nodes || nodes.length === 0) ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No curriculum nodes defined yet. Click "Add Node" to start building.
          </div>
        ) : (
          <div className="divide-y">
            {nodes.map((node: any, index: number) => (
              <div
                key={node.id}
                className="flex items-start justify-between p-6 hover:bg-muted/10 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{node.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {node.description}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground font-medium">
                      Estimated Duration: {node.estimatedDurationHours ?? 2} hours
                    </div>
                    {node.resources && node.resources.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {node.resources.map((res: any) => (
                          <div key={res.id} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-md w-max max-w-full">
                            <Link2 className="h-3 w-3 shrink-0" />
                            <a href={res.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                              {res.title}
                            </a>
                            <Badge variant="foreground" className="text-[10px] h-4 py-0 ml-2">{res.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 mr-2 border-r pr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0 || reorderNodeMutation.isPending}
                      onClick={() => reorderNodeMutation.mutate({ id: node.id, direction: "up" })}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={!nodes || index === nodes.length - 1 || reorderNodeMutation.isPending}
                      onClick={() => reorderNodeMutation.mutate({ id: node.id, direction: "down" })}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <ManageResourcesDialog node={node} skillId={skillId} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingNode(node);
                      editForm.setFieldValue("title", node.title);
                      editForm.setFieldValue("description", node.description);
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this node?")) {
                        deleteNodeMutation.mutate({ id: node.id });
                      }
                    }}
                    disabled={deleteNodeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!editingNode}
        onOpenChange={(open) => {
          if (!open) setEditingNode(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
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
              name="title"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <editForm.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            />
            <editForm.Field
              name="estimatedDurationHours"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Estimated Duration (Hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(parseInt(e.target.value) || 1)}
                  />
                </div>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={editForm.state.isSubmitting || updateNodeMutation.isPending}
            >
              {(editForm.state.isSubmitting || updateNodeMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ManageResourcesDialog({ node, skillId }: { node: any; skillId: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const addResourceMutation = useMutation({
    ...trpc.Resources.updateResourcesForCurriculumNode.mutationOptions(),
    onSuccess: () => {
      toast.success("Resource added successfully");
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add resource");
    },
  });

  const deleteResourceMutation = useMutation({
    ...trpc.Resources.deleteCurriculumNodeResource.mutationOptions(),
    onSuccess: () => {
      toast.success("Resource deleted");
      queryClient.invalidateQueries(trpc.curriculum.getCurriculumNodes.queryFilter({ skillId }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete resource");
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      type: "article",
      url: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.title || !value.url || !value.type) {
        toast.error("Please fill in all fields");
        return;
      }
      
      try {
        new URL(value.url);
      } catch (e) {
        toast.error("Please enter a valid URL (e.g., https://example.com)");
        return;
      }

      await addResourceMutation.mutateAsync({
        curriculumNodeId: node.id,
        resources: [
          {
            title: value.title,
            type: value.type,
            url: value.url,
            displayOrder: node.resources ? node.resources.length : 0,
          },
        ],
      });
      form.reset();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="mr-2">
          <Link2 className="mr-2 h-4 w-4" />
          Resources ({node.resources?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Resources</DialogTitle>
          <DialogDescription>
            Add articles, videos, or documentation links for "{node.title}".
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-none">Current Resources</h4>
            {(!node.resources || node.resources.length === 0) ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md text-center">
                No resources attached yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {node.resources.map((res: any) => (
                  <div key={res.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Badge variant="foreground" className="text-[10px] uppercase h-4 py-0">{res.type}</Badge>
                        <span className="font-medium text-sm truncate">{res.title}</span>
                      </div>
                      <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline truncate">
                        {res.url}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this resource?")) {
                          deleteResourceMutation.mutate({ id: res.id });
                        }
                      }}
                      disabled={deleteResourceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 border-t pt-6"
          >
            <h4 className="text-sm font-medium leading-none mb-4">Add New Resource</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="title"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. React Official Docs"
                    />
                  </div>
                )}
              />
              <form.Field
                name="type"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    >
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="documentation">Documentation</option>
                      <option value="course">Course</option>
                    </select>
                  </div>
                )}
              />
            </div>
            
            <form.Field
              name="url"
              children={(field) => (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.state.isSubmitting || addResourceMutation.isPending}
            >
              {(form.state.isSubmitting || addResourceMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Resource
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
