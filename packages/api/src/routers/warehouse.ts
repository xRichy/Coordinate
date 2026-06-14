import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure } from "../trpc";
import { StockMovementType, SalesChannel } from "@coordinate/database";

// ── Product CRUD ──────────────────────────────────────────────────────────────

const productRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: tenantProcedure
    .input(
      z.object({
        sku: z.string().min(2),
        name: z.string().min(2),
        category: z.string().min(2),
        price: z.number().positive(),
        costPrice: z.number().nonnegative().optional(),
        imageUrl: z.string().url().nullish(),
        stockQuantity: z.number().int().nonnegative(),
        lowStockThreshold: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.create({
        data: { tenantId: ctx.tenantId, ...input },
      });
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          sku: z.string().min(2).optional(),
          name: z.string().min(2).optional(),
          category: z.string().min(2).optional(),
          price: z.number().positive().optional(),
          costPrice: z.number().nonnegative().optional(),
          imageUrl: z.string().url().nullish(),
          stockQuantity: z.number().int().nonnegative().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.product.delete({ where: { id: input.id } });
      return { id: input.id };
    }),

  importBatch: tenantProcedure
    .input(
      z
        .array(
          z.object({
            sku: z.string().min(2),
            name: z.string().min(2),
            category: z.string().min(2),
            price: z.number().positive(),
            costPrice: z.number().nonnegative().optional(),
            stockQuantity: z.number().int().nonnegative().optional(),
            lowStockThreshold: z.number().int().nonnegative().optional(),
          })
        )
        .min(1)
        .max(500)
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.product.createMany({
        data: input.map((p) => ({ tenantId: ctx.tenantId, ...p })),
        skipDuplicates: true, // skip rows whose (tenantId, sku) already exists
      });
      return { count: result.count };
    }),
});

// ── StockMovement ─────────────────────────────────────────────────────────────

const stockMovementRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true } } },
    });
  }),

  record: tenantProcedure
    .input(
      z.object({
        productId: z.string(),
        type: z.nativeEnum(StockMovementType),
        quantity: z.number().int().positive(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Both ops run inside the same withTenant transaction — atomic.
      const movement = await ctx.db.stockMovement.create({
        data: {
          tenantId: ctx.tenantId,
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          note: input.note,
        },
      });
      const delta = input.type === StockMovementType.in ? input.quantity : -input.quantity;
      await ctx.db.product.update({
        where: { id: input.productId },
        data: { stockQuantity: { increment: delta } },
      });
      return movement;
    }),
});

// ── Sales (ordini di vendita + margini) ───────────────────────────────────────

const salesRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.sale.findMany({
      orderBy: { soldAt: "desc" },
      include: { product: { select: { name: true, sku: true } } },
    });
  }),

  /** Record a sale: snapshot the cost, decrement stock (out movement), keep margin history. */
  record: tenantProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        channel: z.nativeEnum(SalesChannel),
        buyer: z.string().max(200).optional(),
        soldAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
        select: { id: true, costPrice: true },
      });
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Prodotto non trovato." });

      // All ops inside the same withTenant transaction — atomic.
      const sale = await ctx.db.sale.create({
        data: {
          tenantId: ctx.tenantId,
          productId: input.productId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          unitCost: product.costPrice, // snapshot
          channel: input.channel,
          buyer: input.buyer ?? null,
          ...(input.soldAt ? { soldAt: input.soldAt } : {}),
        },
      });
      await ctx.db.stockMovement.create({
        data: {
          tenantId: ctx.tenantId,
          productId: input.productId,
          type: StockMovementType.out,
          quantity: input.quantity,
          note: `Vendita ${input.channel}`,
        },
      });
      await ctx.db.product.update({
        where: { id: input.productId },
        data: { stockQuantity: { decrement: input.quantity } },
      });
      return sale;
    }),

  /** Delete a sale: restock the product with a compensating in-movement. */
  delete: tenantProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const sale = await ctx.db.sale.findUnique({
      where: { id: input.id },
      select: { id: true, productId: true, quantity: true },
    });
    if (!sale) throw new TRPCError({ code: "NOT_FOUND", message: "Vendita non trovata." });

    await ctx.db.stockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        productId: sale.productId,
        type: StockMovementType.in,
        quantity: sale.quantity,
        note: "Storno vendita",
      },
    });
    await ctx.db.product.update({
      where: { id: sale.productId },
      data: { stockQuantity: { increment: sale.quantity } },
    });
    await ctx.db.sale.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  /** Margin report: totals, per-channel breakdown, top products by profit. */
  report: tenantProcedure
    .input(z.object({ days: z.number().int().positive().max(3650).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const since = input?.days ? new Date(Date.now() - input.days * 86_400_000) : undefined;
      const sales = await ctx.db.sale.findMany({
        where: since ? { soldAt: { gte: since } } : undefined,
        include: { product: { select: { name: true } } },
      });

      let revenue = 0;
      let cost = 0;
      let units = 0;
      const byChannel = new Map<string, { revenue: number; profit: number; units: number }>();
      const byProduct = new Map<string, { name: string; profit: number; units: number }>();
      for (const s of sales) {
        const rev = s.unitPrice * s.quantity;
        const cst = s.unitCost * s.quantity;
        revenue += rev;
        cost += cst;
        units += s.quantity;
        const ch = byChannel.get(s.channel) ?? { revenue: 0, profit: 0, units: 0 };
        ch.revenue += rev;
        ch.profit += rev - cst;
        ch.units += s.quantity;
        byChannel.set(s.channel, ch);
        const pr = byProduct.get(s.productId) ?? { name: s.product.name, profit: 0, units: 0 };
        pr.profit += rev - cst;
        pr.units += s.quantity;
        byProduct.set(s.productId, pr);
      }
      const round = (n: number) => Math.round(n * 100) / 100;
      return {
        totalRevenue: round(revenue),
        totalProfit: round(revenue - cost),
        totalUnits: units,
        salesCount: sales.length,
        byChannel: [...byChannel.entries()]
          .map(([channel, v]) => ({ channel, revenue: round(v.revenue), profit: round(v.profit), units: v.units }))
          .sort((a, b) => b.profit - a.profit),
        topProducts: [...byProduct.values()]
          .map((v) => ({ name: v.name, profit: round(v.profit), units: v.units }))
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5),
      };
    }),
});

export const warehouseRouter = router({
  product: productRouter,
  stockMovement: stockMovementRouter,
  sales: salesRouter,
});
