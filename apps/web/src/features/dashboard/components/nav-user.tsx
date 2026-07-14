import { ChevronsUpDown, LogOut, Moon, Sun, Trash2, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { setTheme,theme } = useTheme();

  const deleteAccountMutation = useMutation({
    ...trpc.user.deleteAccount.mutationOptions(),
    onSuccess: async () => {
      await authClient.signOut({
        fetchOptions: {
          onResponse: () => {
            navigate("/");
            toast.success("Account successfully deleted");
          },
        },
      });
    },
    onError: () => {
      toast.error("Failed to delete account");
    }
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteDialog(true);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <Avatar>
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-inherit">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent sideOffset={12} side={isMobile ? "top" : "right"} align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-inherit">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="scale-100 dark:scale-0" />
                <Moon className="absolute scale-0 dark:scale-100" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
          checked={theme === "light"}
          onCheckedChange={(v) => v && setTheme("light")}
        >
          Light
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onCheckedChange={(v) => v && setTheme("dark")}
        >
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "system"}
          onCheckedChange={(v) => v && setTheme("system")}
        >
          System
        </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onResponse: async () => {
                     navigate("/")
                    },
                  },
                });
              }}
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to completely delete your account and all associated data? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteAccountMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteAccountMutation.mutate()} disabled={deleteAccountMutation.isPending}>
              {deleteAccountMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  );
}
