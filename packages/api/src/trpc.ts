import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth, isSuperAdmin } from "@coordinate/core/auth";
import { resolveTenantBySlug } from "@coordinate/core/tenant";
import { prismaAdmin, withTenant } from "@coordinate/database";

// ── Context ───────────────────────────────────────────────────────────────────

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const headers = req.headers;

  // Better-Auth session — null when unauthenticated (publicProcedure callers)
  const session = await auth.api.getSession({ headers }).catch(() => null);

  // Set by apps/web/src/middleware.ts for tenant subdomains
  const tenantSlug = headers.get("x-tenant-slug") ?? null;

  return { session, tenantSlug };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// ── tRPC init ─────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const middleware = t.middleware;

// ── Procedures ────────────────────────────────────────────────────────────────

/** No authentication required. */
export const publicProcedure = t.procedure;

/** Requires a valid Better-Auth session. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Requires a platform super-admin (the operator). Cross-tenant — procedures
 * built on this must use `prismaAdmin` (no tenant RLS context). Gated by the
 * `SUPER_ADMIN_EMAILS` allowlist, not a DB role.
 */
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isSuperAdmin(ctx.session.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super-admin only" });
  }
  return next({ ctx });
});

/**
 * Requires an authenticated session AND a tenant context (x-tenant-slug header).
 * Wraps the handler in a withTenant() transaction so all Prisma calls inside
 * the procedure are automatically scoped to the current tenant via RLS.
 *
 * Adds to context:
 *   ctx.tenantId  — cuid string of the current tenant
 *   ctx.db        — Prisma TransactionClient already scoped via set_config()
 */
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantSlug) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No tenant context — request must come from a tenant subdomain",
    });
  }

  const tenant = await resolveTenantBySlug(ctx.tenantSlug);
  if (!tenant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Tenant not found: ${ctx.tenantSlug}`,
    });
  }

  // Verify the authenticated user is a member of this tenant.
  // Uses prismaAdmin (bypasses RLS) since no tenant context is set yet.
  const membership = await prismaAdmin.membership.findFirst({
    where: { userId: ctx.session.user.id, tenantId: tenant.id },
    select: { id: true },
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this tenant",
    });
  }

  return withTenant(tenant.id, (db) =>
    next({
      ctx: {
        ...ctx,
        tenantId: tenant.id,
        tenant,
        db,
      },
    })
  );
});
