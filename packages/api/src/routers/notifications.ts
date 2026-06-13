import { z } from "zod";
import { router, tenantProcedure } from "../trpc";

// In-app notifications for the current user within the current tenant.
// Recipient is always the authenticated user; tenant isolation via RLS (ctx.db).
export const notificationsRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { recipientId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  unreadCount: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { recipientId: ctx.session.user.id, readAt: null },
    });
  }),

  markAsRead: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: { id: input.id, recipientId: ctx.session.user.id },
        data: { readAt: new Date() },
      });
      return { id: input.id };
    }),

  markAllAsRead: tenantProcedure.mutation(async ({ ctx }) => {
    const res = await ctx.db.notification.updateMany({
      where: { recipientId: ctx.session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: res.count };
  }),
});
