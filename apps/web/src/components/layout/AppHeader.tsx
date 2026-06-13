"use client";

import { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient, signOut } from "@/lib/auth-client";
import { getLoginUrl } from "@/lib/tenant-url";

export function AppHeader() {
    const [userName, setUserName] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    useEffect(() => {
        authClient.getSession().then(({ data }) => {
            setUserName(data?.user?.name ?? null);
        });
    }, []);

    async function handleLogout() {
        setIsSigningOut(true);
        await signOut();
        window.location.assign(getLoginUrl());
    }

    return (
        <header className="sticky top-0 z-30 flex h-20 md:h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-2 h-12 w-12 md:h-8 md:w-8 [&>svg]:size-6 md:[&>svg]:size-4" />

            <div className="flex flex-1 items-center gap-4 md:gap-8">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                <NotificationsBell />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full overflow-hidden h-12 w-12 md:h-10 md:w-10">
                            <User className="h-6 w-6 md:h-5 md:w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-normal">
                            <p className="text-sm font-medium">{userName ?? "Account"}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Impostazioni</DropdownMenuItem>
                        <DropdownMenuItem>Supporto</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={isSigningOut}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isSigningOut ? "Disconnessione…" : "Esci"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
