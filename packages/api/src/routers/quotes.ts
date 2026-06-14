import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { QuoteStatus } from "@coordinate/database";
import { router, tenantProcedure } from "../trpc";
import { requirePermission } from "../middleware/permission";

const lineInput = z.object({
  description: z.string().trim().min(1, "Descrizione obbligatoria").max(500),
  quantity: z.number().min(0),
  unitPrice: z.number(),
  discountPct: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(22),
});

const quoteInput = z.object({
  contactId: z.string().nullish(),
  contactName: z.string().trim().min(1, "Cliente obbligatorio").max(200),
  validUntil: z.coerce.date().nullish(),
  notes: z.string().max(2000).nullish(),
  lines: z.array(lineInput).default([]),
});

type LineCalc = { quantity: number; unitPrice: number; discountPct: number; taxRate: number };

/** Authoritative totals: net = qty·price·(1−disc%); tax = net·rate%. Rounded to cents. */
function computeTotals(lines: LineCalc[]) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const l of lines) {
    const net = l.quantity * l.unitPrice * (1 - l.discountPct / 100);
    subtotal += net;
    taxTotal += net * (l.taxRate / 100);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { subtotal: round(subtotal), taxTotal: round(taxTotal), total: round(subtotal + taxTotal) };
}

const COMPANY_KEYS = ["company.name", "company.vat", "company.taxCode", "company.address"] as const;

export const quotesRouter = router({
  list: tenantProcedure.query(({ ctx }) =>
    ctx.db.quote.findMany({
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        contactName: true,
        status: true,
        issueDate: true,
        validUntil: true,
        total: true,
      },
    })
  ),

  get: tenantProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const quote = await ctx.db.quote.findUnique({
      where: { id: input.id },
      include: { lines: { orderBy: { position: "asc" } } },
    });
    if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Preventivo non trovato." });
    return quote;
  }),

  create: tenantProcedure.input(quoteInput).mutation(async ({ ctx, input }) => {
    const max = await ctx.db.quote.aggregate({ _max: { number: true } });
    const number = (max._max.number ?? 0) + 1;
    const totals = computeTotals(input.lines);

    const quote = await ctx.db.quote.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        contactId: input.contactId ?? null,
        contactName: input.contactName,
        validUntil: input.validUntil ?? null,
        notes: input.notes ?? null,
        ...totals,
      },
    });
    if (input.lines.length) {
      await ctx.db.quoteLine.createMany({
        data: input.lines.map((l, i) => ({ tenantId: ctx.tenantId, quoteId: quote.id, position: i, ...l })),
      });
    }
    return { id: quote.id, number };
  }),

  update: tenantProcedure
    .input(quoteInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quote.findUnique({ where: { id: input.id }, select: { id: true } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Preventivo non trovato." });

      const totals = computeTotals(input.lines);
      // Replace lines wholesale (simplest correct edit for a draft document).
      await ctx.db.quoteLine.deleteMany({ where: { quoteId: input.id } });
      if (input.lines.length) {
        await ctx.db.quoteLine.createMany({
          data: input.lines.map((l, i) => ({ tenantId: ctx.tenantId, quoteId: input.id, position: i, ...l })),
        });
      }
      await ctx.db.quote.update({
        where: { id: input.id },
        data: {
          contactId: input.contactId ?? null,
          contactName: input.contactName,
          validUntil: input.validUntil ?? null,
          notes: input.notes ?? null,
          ...totals,
        },
      });
      return { id: input.id };
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          QuoteStatus.draft,
          QuoteStatus.sent,
          QuoteStatus.accepted,
          QuoteStatus.rejected,
          QuoteStatus.expired,
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.quote.update({ where: { id: input.id }, data: { status: input.status } });
      return { ok: true };
    }),

  delete: tenantProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.quote.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  /** Emitter company data (used on quotes + future invoices), stored as TenantSettings. */
  companyInfo: router({
    get: tenantProcedure.query(async ({ ctx }) => {
      const rows = await ctx.db.tenantSetting.findMany({ where: { key: { in: [...COMPANY_KEYS] } } });
      const map = new Map(rows.map((r) => [r.key, r.value as string]));
      return {
        name: map.get("company.name") ?? "",
        vat: map.get("company.vat") ?? "",
        taxCode: map.get("company.taxCode") ?? "",
        address: map.get("company.address") ?? "",
      };
    }),

    set: tenantProcedure
      .use(requirePermission("tenant:settings:write"))
      .input(
        z.object({
          name: z.string().max(200),
          vat: z.string().max(50),
          taxCode: z.string().max(50),
          address: z.string().max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const entries: [string, string][] = [
          ["company.name", input.name],
          ["company.vat", input.vat],
          ["company.taxCode", input.taxCode],
          ["company.address", input.address],
        ];
        for (const [key, value] of entries) {
          await ctx.db.tenantSetting.upsert({
            where: { tenantId_key: { tenantId: ctx.tenantId, key } },
            update: { value },
            create: { tenantId: ctx.tenantId, key, value },
          });
        }
        return { ok: true };
      }),
  }),
});
