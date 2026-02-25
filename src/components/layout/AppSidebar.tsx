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
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Users,
    Kanban,
    CheckSquare,
    Settings,
    Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/crm/customers", icon: Users },
    { name: "Leads Board", href: "/crm/leads", icon: Kanban },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
                    <Target className="h-6 w-6" />
                    <span>Coordinate</span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4 gap-1">
                <SidebarMenu>
                    <div className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Menu
                    </div>
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                                    <Link href={item.href} className="flex items-center gap-3">
                                        <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                        <span className={isActive ? "font-medium" : ""}>{item.name}</span>
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
                        <SidebarMenuButton asChild>
                            <Link href="/settings" className="flex items-center gap-3">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
