import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/sidebar";

import { NotificationBell } from "@/features/dashboard/components/notification-bell";
import { StreakWidget } from "@/features/dashboard/components/streak-widget";
import { PushNotificationBanner } from "@/features/dashboard/components/push-banner";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="flex h-16 px-1 sm:px-4 shrink-0 items-center gap-2 justify-between w-full">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <StreakWidget />
            <NotificationBell />
          </div>
        </header>
        <PushNotificationBanner />
        <div className="flex flex-1 flex-col gap-4 p-1 sm:p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
