"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  Settings,
  Target,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "crm/customers", icon: Users },
  { name: "Leads Board", path: "crm/leads", icon: Kanban },
  { name: "Tasks", path: "tasks", icon: CheckSquare },
  { name: "Warehouse", path: "warehouse", icon: Package },
];

export function AppSidebar({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const base = `/t/${tenantSlug}`;

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
        <Link
          href={`${base}/dashboard`}
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Target className="h-6 w-6" />
          <span>Coordinate</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 gap-2">
        <SidebarMenu>
          <div className="px-2 pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const href = `${base}/${item.path}`;
            const isActive = pathname.startsWith(href);
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  size="lg"
                  className="py-5 md:py-2 h-auto"
                >
                  <Link
                    href={href}
                    className="flex items-center gap-4 w-full"
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <item.icon
                      className={cn(
                        "h-6 w-6 md:h-5 md:w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-lg md:text-base",
                        isActive ? "font-semibold" : ""
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="py-5 md:py-2 h-auto">
              <Link
                href={`${base}/settings`}
                className="flex items-center gap-4 w-full"
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <Settings className="h-6 w-6 md:h-5 md:w-5 text-muted-foreground" />
                <span className="text-lg md:text-base">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
