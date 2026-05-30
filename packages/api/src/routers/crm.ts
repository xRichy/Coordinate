import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { ContactType, ContactStatus, LeadStatus } from "@coordinate/database";

// ── Contact CRUD ──────────────────────────────────────────────────────────────

const contactRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2),
        type: z.nativeEnum(ContactType).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.nativeEnum(ContactStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contact.create({
        data: { tenantId: ctx.tenantId, ...input },
      });
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(2).optional(),
          type: z.nativeEnum(ContactType).optional(),
          email: z.string().email().nullish(),
          phone: z.string().nullish(),
          company: z.string().nullish(),
          status: z.nativeEnum(ContactStatus).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contact.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

// ── Lead CRUD ─────────────────────────────────────────────────────────────────

const leadRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: tenantProcedure
    .input(
      z.object({
        title: z.string().min(2),
        value: z.number().min(0).optional(),
        contactName: z.string().optional(),
        status: z.nativeEnum(LeadStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.create({
        data: { tenantId: ctx.tenantId, ...input },
      });
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(LeadStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lead.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

export const crmRouter = router({
  contact: contactRouter,
  lead: leadRouter,
});
