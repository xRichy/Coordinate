import { router, protectedProcedure } from "../trpc";
import { prismaAdmin, type MemberRole } from "@coordinate/database";

export const onboardingRouter = router({
  // Uses prismaAdmin (superuser, bypasses RLS) to list all tenants a user
  // belongs to across all orgs — needed on the login page before tenant context is set.
  getMyTenants: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await prismaAdmin.membership.findMany({
      where: { userId: ctx.session.user.id },
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => m.tenant);
  }),

  // Returns the current user's role in the tenant identified by the x-tenant-slug
  // header, plus whether they have 2FA enabled. Used by useCan() for UI permission
  // gating and by <TwoFactorGate> to enforce mandatory 2FA for Owners.
  getMyMembership: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantSlug) return null;

    const membership = await prismaAdmin.membership.findFirst({
      where: {
        userId: ctx.session.user.id,
        tenant: { slug: ctx.tenantSlug },
      },
    });

    if (!membership) return null;

    const user = await prismaAdmin.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { twoFactorEnabled: true },
    });

    return {
      role: membership.role as MemberRole,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
    };
  }),
});
