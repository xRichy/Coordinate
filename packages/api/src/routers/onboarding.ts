import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { prisma, prismaAdmin, withTenant } from "@coordinate/database";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export const onboardingRouter = router({
  createTenant: protectedProcedure
    .input(z.object({ companyName: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.companyName);

      const existing = await prisma.tenant.findUnique({ where: { slug } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Il nome "${input.companyName}" è già in uso. Prova un nome leggermente diverso.`,
        });
      }

      const tenant = await prisma.tenant.create({
        data: { slug, name: input.companyName, plan: "starter", status: "active" },
      });

      // Membership is RLS-protected — must run inside withTenant
      await withTenant(tenant.id, (tx) =>
        tx.membership.create({
          data: { tenantId: tenant.id, userId: ctx.session.user.id, role: "owner" },
        })
      );

      return { tenant };
    }),

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
});
