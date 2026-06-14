import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { put } from "@vercel/blob";
import { prismaAdmin, withTenant, TenantPlan, TenantStatus } from "@coordinate/database";
import { provisionTenant } from "@coordinate/core/provisioning";
import { router, superAdminProcedure } from "../trpc";
import { MODULE_CATALOG } from "./tenant";
import { buildTenantExportZip } from "../lib/tenant-export";

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

    /**
     * Archive the tenant's data to Vercel Blob, then delete the tenant from the
     * DB. The archive ZIP (CSV of all data + manifest of file URLs) is uploaded
     * to Blob; existing Blob files (photos/attachments) are left intact. The DB
     * delete cascades all tenant rows. Destructive — requires the slug to match.
     */
    delete: superAdminProcedure
      .input(z.object({ tenantId: z.string(), confirmSlug: z.string() }))
      .mutation(async ({ input }) => {
        const tenant = await prismaAdmin.tenant.findUnique({
          where: { id: input.tenantId },
          select: { id: true, name: true, slug: true },
        });
        if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant non trovato." });
        if (input.confirmSlug.trim() !== tenant.slug) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Lo slug di conferma non corrisponde." });
        }
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Storage non configurato (BLOB_READ_WRITE_TOKEN mancante): impossibile archiviare.",
          });
        }

        // 1. Build the data archive (RLS-scoped to this tenant).
        const zip = await withTenant(tenant.id, (db) =>
          buildTenantExportZip(db, { name: tenant.name, slug: tenant.slug }, { includeFileManifest: true })
        );
        const buffer = await zip.generateAsync({ type: "nodebuffer" });

        // 2. Upload the archive to Blob (files already on Blob stay where they are).
        const date = new Date().toISOString().slice(0, 10);
        const blob = await put(`archives/${tenant.slug}-${date}.zip`, buffer, {
          access: "public",
          addRandomSuffix: true,
          contentType: "application/zip",
        });

        // 3. Delete the tenant from the DB (cascades all rows).
        await prismaAdmin.tenant.delete({ where: { id: tenant.id } });

        return { slug: tenant.slug, archiveUrl: blob.url };
      }),
  }),
});
