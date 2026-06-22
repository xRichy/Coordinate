"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";

/**
 * Enforces mandatory 2FA for Owners (mvp-scope §6). When the current user is an
 * owner of this tenant and has not yet enabled two-factor authentication, the
 * whole app is blocked by a full-screen overlay that pushes them to the security
 * settings page to enroll. The security page itself is exempt (otherwise the
 * redirect would loop). For non-owners 2FA stays optional, so nothing blocks.
 */
export function TwoFactorGate({ tenantSlug }: { tenantSlug: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useQuery(trpc.onboarding.getMyMembership.queryOptions());

  const securityPath = `/t/${tenantSlug}/settings/security`;
  const onSecurityPage = pathname === securityPath;
  const mustEnroll = data?.role === "owner" && data.twoFactorEnabled === false && !onSecurityPage;

  useEffect(() => {
    if (mustEnroll) router.replace(securityPath);
  }, [mustEnroll, router, securityPath]);

  if (!mustEnroll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md rounded-xl border border-border/60 bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Attiva la verifica in due passaggi</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Come proprietario dell&apos;azienda devi proteggere l&apos;account con la 2FA prima di continuare.
        </p>
        <Button className="mt-6 w-full" onClick={() => router.replace(securityPath)}>
          Configura ora
        </Button>
      </div>
    </div>
  );
}
