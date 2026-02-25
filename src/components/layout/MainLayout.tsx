"use client";

import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { usePathname } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Don't show sidebar and header on the login page
    const isAuthPage = pathname === "/login";

    if (isAuthPage) {
        return <main className="flex-1">{children}</main>;
    }

    return (
        <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 w-full bg-muted/20">
                <AppHeader />
                <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
