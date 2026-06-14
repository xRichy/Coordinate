import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prismaAdmin, TenantPlan, TenantStatus } from "@coordinate/database";
import { provisionTenant } from "@coordinate/core/provisioning";
import { router, superAdminProcedure } from "../trpc";
import { MODULE_CATALOG } from "./tenant";

const MODULE_IDS = new Set<string>(MODULE_CATALOG.map((m) => m.id));
const planEnum = z.enum([TenantPlan.starter, TenantPlan.pro, TenantPlan.business]);
const statusEnum = z.enum([TenantStatus.active, TenantStatus.suspended, TenantStatus.cancelled]);

export const adminRouter = router({
  /** Module catalog (for the create/edit forms). */
  moduleCatalog: superAdminProcedure.query(() => MODULE_CATALOG),

  tenants: router({
    /** All tenants with seat usage and owner. Cross-tenant (prismaAdmin). */
    list: superAdminProcedure.query(async () => {
      const tenants = await prismaAdmin.tenant.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          plan: true,
          status: true,
          enabledModules: true,
          maxSeats: true,
          createdAt: true,
          _count: { select: { memberships: true } },
          memberships: {
            where: { role: "owner" },
            select: { user: { select: { email: true, name: true } } },
            take: 1,
          },
        },
      });

      return tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        plan: t.plan,
        status: t.status,
        enabledModules: t.enabledModules,
        maxSeats: t.maxSeats,
        seatsUsed: t._count.memberships,
        owner: t.memberships[0]?.user ?? null,
        createdAt: t.createdAt,
      }));
    }),

    /** Provision a new tenant (web version of the T4.17 CLI). */
    create: superAdminProcedure
      .input(
        z.object({
          slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug non valido (a-z, 0-9, trattini)"),
          name: z.string().trim().min(1, "Nome obbligatorio").max(120),
          ownerEmail: z.string().trim().toLowerCase().email("Email non valida"),
          ownerName: z.string().trim().min(1, "Nome owner obbligatorio").max(120),
          plan: planEnum.optional(),
          enabledModules: z.array(z.string()).optional(),
          maxSeats: z.number().int().min(1).max(999).optional(),
          password: z.string().min(8).max(72).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const enabledModules = input.enabledModules
          ? [...new Set(input.enabledModules.filter((m) => MODULE_IDS.has(m)))]
          : undefined;
        try {
          const result = await provisionTenant({ ...input, enabledModules });
          return {
            slug: result.tenant.slug,
            ownerEmail: result.owner.email,
            generatedPassword: result.generatedPassword,
          };
        } catch (e) {
          throw new TRPCError({
            code: "CONFLICT",
            message: e instanceof Error ? e.message : "Provisioning fallito",
          });
        }
      }),

    /** Update plan/status/modules and — the key operation — the seat limit. */
    update: superAdminProcedure
      .input(
        z.object({
          tenantId: z.string(),
          maxSeats: z.number().int().min(1).max(999).optional(),
          status: statusEnum.optional(),
          plan: planEnum.optional(),
          enabledModules: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { tenantId, enabledModules, ...rest } = input;
        const data: {
          maxSeats?: number;
          status?: TenantStatus;
          plan?: TenantPlan;
          enabledModules?: string[];
        } = { ...rest };
        if (enabledModules) {
          data.enabledModules = [...new Set(enabledModules.filter((m) => MODULE_IDS.has(m)))];
        }

        const updated = await prismaAdmin.tenant.update({
          where: { id: tenantId },
          data,
          select: { id: true, maxSeats: true, status: true, plan: true, enabledModules: true },
        });
        return updated;
      }),
  }),
});
