import { TRPCError } from "@trpc/server";
import { prismaAdmin, type MemberRole } from "@coordinate/database";
import { can, type Permission } from "@coordinate/core";
import { middleware } from "../trpc";

/**
 * Builds a tRPC middleware that guards a procedure behind a single permission.
 * Must be composed after protectedProcedure (session required) and only makes
 * sense on tenant subdomains where ctx.tenantSlug is populated.
 *
 * Usage:
 *   tenantProcedure.use(requirePermission("tenant:settings:write")).mutation(...)
 *
 * Adds `ctx.userRole` (the resolved MemberRole) to the downstream context.
 */
export function requirePermission(permission: Permission) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!ctx.tenantSlug) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "requirePermission requires a tenant context",
      });
    }

    const membership = await prismaAdmin.membership.findFirst({
      where: {
        userId: ctx.session.user.id,
        tenant: { slug: ctx.tenantSlug },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User has no membership in this tenant",
      });
    }

    if (!can(membership.role as MemberRole, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing permission: ${permission}`,
      });
    }

    return next({ ctx: { ...ctx, userRole: membership.role as MemberRole } });
  });
}
