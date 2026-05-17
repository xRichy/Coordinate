"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

function getTenantDashboardUrl(slug: string): string {
  const { hostname, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://${slug}.lvh.me${portSuffix}/dashboard`;
  }
  return `https://${slug}.coordinate.app/dashboard`;
}

export default function Home() {
  const trpcClient = useTRPCClient();

  useEffect(() => {
    async function resolveDestination() {
      const { data: session } = await authClient.getSession();

      if (!session?.user) {
        window.location.assign("/login");
        return;
      }

      let tenants: { slug: string }[] = [];
      try {
        tenants = await trpcClient.onboarding.getMyTenants.query();
      } catch {
        window.location.assign("/login");
        return;
      }

      if (tenants.length === 0) {
        window.location.assign("/signup");
        return;
      }

      if (tenants.length === 1) {
        window.location.assign(getTenantDashboardUrl(tenants[0].slug));
        return;
      }

      // Multiple tenants: go to login where the tenant picker is shown.
      window.location.assign("/login");
    }

    resolveDestination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
