"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { can } from "@coordinate/core";
import type { Permission } from "@coordinate/core";

/**
 * Returns whether the current user has the given permission in the current tenant.
 * Uses the role returned by onboarding.getMyMembership, which reads the
 * x-tenant-slug header set by the middleware on tenant subdomains.
 *
 * Returns false while loading or when there is no membership (e.g. on the
 * root domain where no tenant context exists).
 */
export function useCan(permission: Permission): boolean {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.onboarding.getMyMembership.queryOptions());

  if (!data) return false;
  return can(data.role, permission);
}
