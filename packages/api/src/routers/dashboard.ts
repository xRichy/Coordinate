import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { DealStatus, LeadStatus } from "@coordinate/database";

type Period = "month" | "quarter" | "year" | "all";

/** Lower bound (inclusive) for the selected period, or null for "all time". */
function periodStart(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarter":
      return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

export const dashboardRouter = router({
  // Single round-trip with every widget value. Tenant-scoped via ctx.db (RLS).
  // Period bounds the time-based widgets (won, new contacts); ownerId filters by
  // contact ownership where an owner exists (deals via their contact, contacts).
  stats: tenantProcedure
    .input(
      z.object({
        period: z.enum(["month", "quarter", "year", "all"]).default("month"),
        ownerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const start = periodStart(input.period);
      const owner = input.ownerId;
      const dueSoon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const dealOwnerWhere = owner ? { contact: { ownerId: owner } } : {};
      const contactOwnerWhere = owner ? { ownerId: owner } : {};

      const [openAgg, wonAgg, leadsAgg, dueTasks, newContacts, products] = await Promise.all([
        ctx.db.deal.aggregate({
          where: { status: DealStatus.open, ...dealOwnerWhere },
          _sum: { value: true },
          _count: true,
        }),
        ctx.db.deal.aggregate({
          where: {
            status: DealStatus.won,
            ...(start ? { closedAt: { gte: start } } : {}),
            ...dealOwnerWhere,
          },
          _sum: { value: true },
          _count: true,
        }),
        ctx.db.lead.aggregate({
          where: { status: { notIn: [LeadStatus.won, LeadStatus.lost] } },
          _sum: { value: true },
          _count: true,
        }),
        ctx.db.activity.count({
          where: { status: { not: "done" }, dueDate: { lte: dueSoon } },
        }),
        ctx.db.contact.count({
          where: {
            deletedAt: null,
            ...(start ? { createdAt: { gte: start } } : {}),
            ...contactOwnerWhere,
          },
        }),
        ctx.db.product.findMany({ select: { price: true, stockQuantity: true } }),
      ]);

      const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stockQuantity, 0);

      return {
        openPipeline: { value: openAgg._sum.value ?? 0, count: openAgg._count },
        won: { value: wonAgg._sum.value ?? 0, count: wonAgg._count },
        activeLeads: { value: leadsAgg._sum.value ?? 0, count: leadsAgg._count },
        dueTasks: { count: dueTasks },
        newContacts: { count: newContacts },
        inventory: { value: inventoryValue, count: products.length },
      };
    }),
});
