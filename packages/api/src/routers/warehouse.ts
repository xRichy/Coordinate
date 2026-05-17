import { z } from "zod";
import { router, tenantProcedure } from "../trpc";

const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stockQuantity: z.number(),
});

const stockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number(),
  type: z.enum(["In", "Out"]),
  date: z.string(),
  note: z.string().optional(),
});

const productRouter = router({
  list: tenantProcedure.output(z.array(productSchema)).query(() => []),

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
    .output(productSchema)
    .mutation(({ input }) => ({ id: crypto.randomUUID(), ...input })),

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
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ id: input.id })),
});

const stockMovementRouter = router({
  list: tenantProcedure.output(z.array(stockMovementSchema)).query(() => []),

  record: tenantProcedure
    .input(
      z.object({
        productId: z.string(),
        type: z.enum(["In", "Out"]),
        quantity: z.number().int().positive(),
        note: z.string().optional(),
      })
    )
    .output(stockMovementSchema)
    .mutation(({ input }) => ({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...input,
    })),
});

export const warehouseRouter = router({
  product: productRouter,
  stockMovement: stockMovementRouter,
});
