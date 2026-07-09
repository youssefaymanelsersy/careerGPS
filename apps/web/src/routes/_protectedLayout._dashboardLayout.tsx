import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/sidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="flex h-16 px-1 sm:px-4 shrink-0 items-center gap-2">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-1 sm:p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
