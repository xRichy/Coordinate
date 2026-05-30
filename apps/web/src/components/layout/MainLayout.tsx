"use client";

import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function MainLayout({
  children,
  tenantSlug,
}: {
  children: React.ReactNode;
  tenantSlug: string;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar tenantSlug={tenantSlug} />
      <div className="flex flex-col flex-1 w-full bg-muted/20">
        <AppHeader />
        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
