import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { ContactType, ContactStatus, LeadStatus } from "@coordinate/database";
import { eventBus, crmPipelineEvents } from "@coordinate/core/events";

// ── Contact CRUD ──────────────────────────────────────────────────────────────

const CONTACT_WITH_RELATIONS = {
  include: {
    parent: { select: { id: true, name: true, type: true } },
    persons: { select: { id: true, name: true, email: true, phone: true, status: true } },
  },
} as const;

const contactRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      orderBy: { createdAt: "desc" },
      ...CONTACT_WITH_RELATIONS,
    });
  }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contact.findFirstOrThrow({
        where: { id: input.id },
        ...CONTACT_WITH_RELATIONS,
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
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contact.create({
        data: { tenantId: ctx.tenantId, ...input },
        ...CONTACT_WITH_RELATIONS,
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
          parentId: z.string().nullish(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contact.update({
        where: { id: input.id },
        data: input.data,
        ...CONTACT_WITH_RELATIONS,
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
      const lead = await ctx.db.lead.findFirstOrThrow({ where: { id: input.id } });
      const updated = await ctx.db.lead.update({
        where: { id: input.id },
        data: { status: input.status },
      });
      // Emit event outside the withTenant transaction (fire-and-forget).
      void eventBus.emit(crmPipelineEvents.leadStatusChanged, ctx.tenantId, {
        leadId: updated.id,
        title: updated.title,
        previousStatus: lead.status,
        newStatus: updated.status,
      });
      return updated;
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
