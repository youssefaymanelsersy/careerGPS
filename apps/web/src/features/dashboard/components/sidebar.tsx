"use client"

import * as React from "react"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { MapIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "react-router"


export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {data: session,isPending} = authClient.useSession();
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/profile" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MapIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">CareerGPS</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        
      </SidebarContent>
      <SidebarFooter>
        {!isPending ? (
          session && <NavUser user={session.user} />
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
