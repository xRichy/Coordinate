import JSZip from "jszip";
import type { Prisma } from "@coordinate/database";

/**
 * Shared tenant-data export used by GDPR export and the admin archive-and-delete.
 * Works with any RLS-scoped Prisma client (ctx.db or a withTenant client).
 */

type Db = Prisma.TransactionClient;

/** Flatten an array of records into a CSV string (RFC-4180-ish quoting). */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

/** Gather all of a tenant's scalar data (no relations / no tsvector). */
export async function collectTenantData(db: Db): Promise<Record<string, Record<string, unknown>[]>> {
  return {
    contacts: await db.contact.findMany(),
    tags: await db.tag.findMany(),
    pipeline_stages: await db.pipelineStage.findMany(),
    leads: await db.lead.findMany(),
    deals: await db.deal.findMany(),
    activities: await db.activity.findMany(),
    products: await db.product.findMany(),
    stock_movements: await db.stockMovement.findMany(),
    sales: await db.sale.findMany(),
    quotes: await db.quote.findMany(),
    quote_lines: await db.quoteLine.findMany(),
    work_orders: await db.workOrder.findMany(),
    settings: await db.tenantSetting.findMany(),
  };
}

/**
 * Build a ZIP of the tenant's data (README + one CSV per entity). When
 * `includeFileManifest` is set, also writes blob-files.csv listing the Vercel
 * Blob URLs (product photos, work-order attachments) — those files stay on Blob.
 */
export async function buildTenantExportZip(
  db: Db,
  meta: { name: string; slug: string },
  opts: { includeFileManifest?: boolean } = {}
): Promise<JSZip> {
  const data = await collectTenantData(db);
  const zip = new JSZip();
  zip.file(
    "README.txt",
    `Export dati tenant "${meta.name}" (${meta.slug})\n` +
      `Generato il ${new Date().toISOString()}\n\n` +
      `Un file CSV per entità. Codifica UTF-8.\n` +
      (opts.includeFileManifest
        ? `blob-files.csv elenca i file su Vercel Blob (restano accessibili al loro URL).\n`
        : ""),
  );
  for (const [name, rows] of Object.entries(data)) {
    zip.file(`${name}.csv`, toCsv(rows));
  }

  if (opts.includeFileManifest) {
    const files: Record<string, unknown>[] = [];
    for (const p of data.products) {
      if (p.imageUrl) files.push({ entity: "product", id: p.id, name: p.name, url: p.imageUrl });
    }
    for (const w of data.work_orders) {
      if (w.attachmentUrl) files.push({ entity: "work_order", id: w.id, name: w.attachmentName ?? w.title, url: w.attachmentUrl });
    }
    zip.file("blob-files.csv", toCsv(files));
  }

  return zip;
}
