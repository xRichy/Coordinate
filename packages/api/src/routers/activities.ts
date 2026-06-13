import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { ActivityType, ActivityPriority, ActivityStatus } from "@coordinate/database";

const activityRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.activity.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: tenantProcedure
    .input(
      z.object({
        title: z.string().min(2),
        type: z.nativeEnum(ActivityType).optional(),
        priority: z.nativeEnum(ActivityPriority).optional(),
        status: z.nativeEnum(ActivityStatus).optional(),
        dueDate: z.string().datetime().optional(),
        notes: z.string().optional(),
        contactId: z.string().optional(),
        dealId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.activity.create({
        data: {
          tenantId: ctx.tenantId,
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
      });
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ActivityStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.activity.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.activity.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

export const activitiesRouter = router({
  activity: activityRouter,
});
