import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { StockMovementType } from "@coordinate/database";

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
        stockQuantity: z.number().int().nonnegative(),
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
          stockQuantity: z.number().int().nonnegative().optional(),
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

export const warehouseRouter = router({
  product: productRouter,
  stockMovement: stockMovementRouter,
});
