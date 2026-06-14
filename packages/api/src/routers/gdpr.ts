import JSZip from "jszip";
import { router, tenantProcedure } from "../trpc";
import { requirePermission } from "../middleware/permission";

/** Flatten an array of records into a CSV string (RFC-4180-ish quoting). */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export const gdprRouter = router({
  /**
   * Export all of the tenant's data as a ZIP of CSV files (GDPR portability).
   * Gated to owner/admin; RLS-scoped via tenantProcedure (ctx.db).
   */
  exportData: tenantProcedure
    .use(requirePermission("tenant:settings:write"))
    .mutation(async ({ ctx }) => {
      // Each findMany returns scalar columns only (no relations / no tsvector),
      // already filtered to this tenant by RLS.
      const data: Record<string, Record<string, unknown>[]> = {
        contacts: await ctx.db.contact.findMany(),
        tags: await ctx.db.tag.findMany(),
        pipeline_stages: await ctx.db.pipelineStage.findMany(),
        leads: await ctx.db.lead.findMany(),
        deals: await ctx.db.deal.findMany(),
        activities: await ctx.db.activity.findMany(),
        products: await ctx.db.product.findMany(),
        stock_movements: await ctx.db.stockMovement.findMany(),
        sales: await ctx.db.sale.findMany(),
        quotes: await ctx.db.quote.findMany(),
        quote_lines: await ctx.db.quoteLine.findMany(),
        work_orders: await ctx.db.workOrder.findMany(),
        settings: await ctx.db.tenantSetting.findMany(),
      };

      const zip = new JSZip();
      const readme =
        `Export dati tenant "${ctx.tenant.name}" (${ctx.tenant.slug})\n` +
        `Generato il ${new Date().toISOString()}\n\n` +
        `Un file CSV per entità. Codifica UTF-8.\n`;
      zip.file("README.txt", readme);
      for (const [name, rows] of Object.entries(data)) {
        zip.file(`${name}.csv`, toCsv(rows));
      }

      const base64 = await zip.generateAsync({ type: "base64" });
      const date = new Date().toISOString().slice(0, 10);
      return { filename: `coordinate-export-${ctx.tenant.slug}-${date}.zip`, base64 };
    }),
});
