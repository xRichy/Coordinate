import { router, tenantProcedure } from "../trpc";
import { requirePermission } from "../middleware/permission";
import { buildTenantExportZip } from "../lib/tenant-export";

export const gdprRouter = router({
  /**
   * Export all of the tenant's data as a ZIP of CSV files (GDPR portability).
   * Gated to owner/admin; RLS-scoped via tenantProcedure (ctx.db).
   */
  exportData: tenantProcedure
    .use(requirePermission("tenant:settings:write"))
    .mutation(async ({ ctx }) => {
      const zip = await buildTenantExportZip(ctx.db, { name: ctx.tenant.name, slug: ctx.tenant.slug });
      const base64 = await zip.generateAsync({ type: "base64" });
      const date = new Date().toISOString().slice(0, 10);
      return { filename: `coordinate-export-${ctx.tenant.slug}-${date}.zip`, base64 };
    }),
});
