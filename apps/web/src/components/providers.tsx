"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@coordinate/api";
import { TRPCProvider } from "@/lib/trpc";
import { PostHogProvider } from "@/components/posthog-provider";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (typeof window === "undefined") return {};
            const match = /^\/t\/([^/]+)(\/|$)/.exec(window.location.pathname);
            if (!match) return {};
            return { "x-tenant-slug": match[1] };
          },
        }),
      ],
    })
  );

  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}
