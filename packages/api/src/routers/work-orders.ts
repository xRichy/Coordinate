import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { WorkOrderStatus } from "@coordinate/database";
import { router, tenantProcedure } from "../trpc";

const baseInput = z.object({
  title: z.string().trim().min(1, "Titolo obbligatorio").max(300),
  contactId: z.string().nullish(),
  contactName: z.string().trim().min(1, "Cliente obbligatorio").max(200),
  quantity: z.number().int().positive().nullish(),
  dueDate: z.coerce.date().nullish(),
  notes: z.string().max(2000).nullish(),
  attachmentUrl: z.string().url().nullish(),
  attachmentName: z.string().max(255).nullish(),
  quoteId: z.string().nullish(),
});

export const workOrdersRouter = router({
  list: tenantProcedure.query(({ ctx }) =>
    ctx.db.workOrder.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { number: "desc" }],
      select: {
        id: true,
        number: true,
        title: true,
        contactId: true,
        contactName: true,
        quantity: true,
        dueDate: true,
        status: true,
        notes: true,
        attachmentUrl: true,
        attachmentName: true,
        quoteId: true,
      },
    })
  ),

  create: tenantProcedure.input(baseInput).mutation(async ({ ctx, input }) => {
    const max = await ctx.db.workOrder.aggregate({ _max: { number: true } });
    const number = (max._max.number ?? 0) + 1;
    const wo = await ctx.db.workOrder.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        title: input.title,
        contactId: input.contactId ?? null,
        contactName: input.contactName,
        quantity: input.quantity ?? null,
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentName: input.attachmentName ?? null,
        quoteId: input.quoteId ?? null,
      },
    });
    return { id: wo.id, number };
  }),

  update: tenantProcedure
    .input(baseInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const existing = await ctx.db.workOrder.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Commessa non trovata." });
      await ctx.db.workOrder.update({
        where: { id },
        data: {
          ...(rest.title !== undefined ? { title: rest.title } : {}),
          ...(rest.contactId !== undefined ? { contactId: rest.contactId } : {}),
          ...(rest.contactName !== undefined ? { contactName: rest.contactName } : {}),
          ...(rest.quantity !== undefined ? { quantity: rest.quantity } : {}),
          ...(rest.dueDate !== undefined ? { dueDate: rest.dueDate } : {}),
          ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
          ...(rest.attachmentUrl !== undefined ? { attachmentUrl: rest.attachmentUrl } : {}),
          ...(rest.attachmentName !== undefined ? { attachmentName: rest.attachmentName } : {}),
        },
      });
      return { id };
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          WorkOrderStatus.todo,
          WorkOrderStatus.in_progress,
          WorkOrderStatus.done,
          WorkOrderStatus.delivered,
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workOrder.update({ where: { id: input.id }, data: { status: input.status } });
      return { ok: true };
    }),

  delete: tenantProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.workOrder.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});
