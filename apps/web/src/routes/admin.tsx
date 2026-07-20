import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet, Link, useLocation } from "react-router";
import Loader from "@/components/composites/loader";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Shield, BookOpen, Wrench, Users, ArrowLeft, RefreshCw, Briefcase } from "lucide-react";
import Logo from "@/components/ui/logo";
import { ModeToggle } from "@/components/composites/mode-toggle";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import UserMenu from "@/components/composites/user-menu";

export default function AdminLayout() {
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  const syncGlobalRoadmapsMutation = useMutation({
    ...trpc.roadmap.syncGlobalRoadmaps.mutationOptions(),
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.usersSynced} user roadmaps!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync global roadmaps");
    },
  });

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.systemRole !== "admin") {
    // If a normal user tries to access admin routes, kick them to dashboard
    return <Navigate to="/roadmap" replace />;
  }

  const navItems = [
    { title: "Dashboard", url: "/admin", icon: Shield, exact: true },
    { title: "Curriculum", url: "/admin/curriculum", icon: BookOpen, exact: false },
    { title: "Skills", url: "/admin/skills", icon: Wrench, exact: false },
    { title: "Roles", url: "/admin/roles", icon: Briefcase, exact: false },
    { title: "Users", url: "/admin/users", icon: Users, exact: false },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="p-4 flex flex-row items-center justify-between">
          <Logo />
          <ModeToggle />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link to={item.url} />}
                  isActive={
                    item.exact 
                      ? location.pathname === item.url 
                      : location.pathname.startsWith(item.url)
                  }
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            <SidebarMenuItem className="mt-8">
              <SidebarMenuButton render={<Link to="/roadmap" />}>
                <ArrowLeft />
                <span>Back to App</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold ml-2">Admin Control Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if(confirm("Are you sure? This will recalculate all roadmaps for all users based on the current curriculum definitions. This action cannot be undone.")) {
                  syncGlobalRoadmapsMutation.mutate();
                }
              }}
              disabled={syncGlobalRoadmapsMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncGlobalRoadmapsMutation.isPending ? "animate-spin" : ""}`} />
              Sync All Users
            </Button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
