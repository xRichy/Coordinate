import { z } from "zod";
import { router, tenantProcedure } from "../trpc";

// ── Shared output shapes ──────────────────────────────────────────────────────
// These types will be replaced by real Prisma models in T2.6 / T2.7.

const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  status: z.enum(["Active", "Inactive"]),
});

const leadSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number(),
  status: z.enum(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]),
  customerName: z.string(),
});

// ── Routers ───────────────────────────────────────────────────────────────────

const contactRouter = router({
  list: tenantProcedure.output(z.array(contactSchema)).query(() => []),

  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(5),
        company: z.string().min(2),
        status: z.enum(["Active", "Inactive"]),
      })
    )
    .output(contactSchema)
    .mutation(({ input }) => ({
      id: crypto.randomUUID(),
      ...input,
    })),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(2).optional(),
          email: z.string().email().optional(),
          phone: z.string().min(5).optional(),
          company: z.string().min(2).optional(),
          status: z.enum(["Active", "Inactive"]).optional(),
        }),
      })
    )
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ id: input.id })),
});

const leadRouter = router({
  list: tenantProcedure.output(z.array(leadSchema)).query(() => []),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]),
      })
    )
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ id: input.id })),
});

export const crmRouter = router({
  contact: contactRouter,
  lead: leadRouter,
});
