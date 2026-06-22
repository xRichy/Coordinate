"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";
import { getTenantDashboardUrl } from "@/lib/tenant-url";

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
        // No self-serve signup: an account always belongs to a tenant created by
        // the operator. A logged-in user with no membership is an orphaned account
        // — sign out and send back to login rather than offering registration.
        await authClient.signOut();
        window.location.assign("/login");
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
