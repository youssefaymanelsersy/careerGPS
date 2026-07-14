import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoleSelectorCardProps {
  currentRoleId: string | null;
}

export function RoleSelectorCard({ currentRoleId }: RoleSelectorCardProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: roles, isLoading } = useQuery(trpc.roles.getAllRoles.queryOptions({ includeScore: false }));

  const setUserRoleMutation = useMutation(trpc.roles.setUserRole.mutationOptions({
      onSuccess: () => {
        toast.success("Active role updated successfully");
        setIsOpen(false);
        // Force page reload so the session picks up the new roleId
        window.location.reload();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update role");
      },
  }));

  const currentRole = roles?.find((r: any) => r.id === currentRoleId);

  return (
    <Card className="shadow-none flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Target Role
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3 mb-4 sm:mb-0 w-full">
            <div className="flex-1 w-full">
              <p className="font-medium text-sm truncate max-w-[150px]" title={currentRole?.title || "Select a role"}>
                {currentRole?.title || "Select a role"}
              </p>
              <p className="text-xs text-muted-foreground">Active Goal</p>
            </div>
          </div>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger 
                disabled={isLoading || setUserRoleMutation.isPending}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs whitespace-nowrap"
            >
                {setUserRoleMutation.isPending ? "Updating..." : "Change Role"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {roles?.map((role: any) => (
                <DropdownMenuItem 
                  key={role.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (role.id !== currentRoleId) {
                      setUserRoleMutation.mutate({ roleId: role.id });
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{role.title}</span>
                  {role.id === currentRoleId && <Check className="w-4 h-4 ml-2 text-primary shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
