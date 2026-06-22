"use client";

import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { TwoFactorGate } from "@/components/auth/two-factor-gate";

export function MainLayout({
  children,
  tenantSlug,
  enabledModules,
}: {
  children: React.ReactNode;
  tenantSlug: string;
  enabledModules: string[];
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar tenantSlug={tenantSlug} enabledModules={enabledModules} />
      <div className="flex flex-col flex-1 w-full bg-muted/20">
        <AppHeader />
        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
      <TwoFactorGate tenantSlug={tenantSlug} />
    </div>
  );
}
