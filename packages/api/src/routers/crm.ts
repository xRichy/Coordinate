import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { ContactType, ContactStatus, LeadStatus, DealStatus, TimelineEventType, NotificationType } from "@coordinate/database";
import type { Prisma, TimelineEvent } from "@coordinate/database";
import { prismaAdmin } from "@coordinate/database";
import { eventBus, crmPipelineEvents } from "@coordinate/core/events";

// ── Contact CRUD ──────────────────────────────────────────────────────────────

const CONTACT_WITH_RELATIONS = {
  include: {
    parent: { select: { id: true, name: true, type: true } },
    persons: { select: { id: true, name: true, email: true, phone: true, status: true } },
    owner: { select: { id: true, name: true } },
    tags: { include: { tag: { select: { id: true, name: true } } } },
  },
} as const;

const contactRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      ...CONTACT_WITH_RELATIONS,
    });
  }),

  listDeleted: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
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

  listMembers: tenantProcedure.query(async ({ ctx }) => {
    const memberships = await prismaAdmin.membership.findMany({
      where: { tenantId: ctx.tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return memberships.map((m) => m.user);
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
        ownerId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tagIds, ...rest } = input;
      return ctx.db.contact.create({
        data: {
          tenantId: ctx.tenantId,
          ...rest,
          tags: tagIds?.length
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
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
          ownerId: z.string().nullish(),
          tagIds: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tagIds, ...rest } = input.data;
      return ctx.db.contact.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(tagIds !== undefined && {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }),
        },
        ...CONTACT_WITH_RELATIONS,
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
      return { id: input.id };
    }),

  restore: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
      return { id: input.id };
    }),

  hardDelete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.delete({ where: { id: input.id } });
      return { id: input.id };
    }),

  importBatch: tenantProcedure
    .input(
      z.array(
        z.object({
          name: z.string().min(1),
          type: z.nativeEnum(ContactType).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          status: z.nativeEnum(ContactStatus).optional(),
        })
      ).min(1).max(500)
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.contact.createMany({
        data: input.map((c) => ({ tenantId: ctx.tenantId, ...c })),
        skipDuplicates: false,
      });
      return { count: result.count };
    }),
});

// ── Tag CRUD ──────────────────────────────────────────────────────────────────

const tagRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({ orderBy: { name: "asc" } });
  }),

  create: tenantProcedure
    .input(z.object({ name: z.string().min(1).max(30) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.upsert({
        where: { tenantId_name: { tenantId: ctx.tenantId, name: input.name.trim() } },
        update: {},
        create: { tenantId: ctx.tenantId, name: input.name.trim() },
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tag.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

// ── PipelineStage CRUD ────────────────────────────────────────────────────────

const DEFAULT_STAGES = ["Nuovo", "Contattato", "Qualificato", "Proposta", "Vinto", "Perso"];

const stageRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    const stages = await ctx.db.pipelineStage.findMany({ orderBy: { order: "asc" } });
    if (stages.length === 0) {
      await ctx.db.pipelineStage.createMany({
        data: DEFAULT_STAGES.map((name, i) => ({ tenantId: ctx.tenantId, name, order: i + 1 })),
      });
      return ctx.db.pipelineStage.findMany({ orderBy: { order: "asc" } });
    }
    return stages;
  }),

  create: tenantProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const agg = await ctx.db.pipelineStage.aggregate({ _max: { order: true } });
      return ctx.db.pipelineStage.create({
        data: { tenantId: ctx.tenantId, name: input.name, order: (agg._max.order ?? 0) + 1 },
      });
    }),

  update: tenantProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pipelineStage.update({ where: { id: input.id }, data: { name: input.name } });
    }),

  reorder: tenantProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int().min(1) })))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.map((item) =>
          ctx.db.pipelineStage.update({ where: { id: item.id }, data: { order: item.order } })
        )
      );
      return { ok: true };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lead.updateMany({ where: { stageId: input.id }, data: { stageId: null } });
      await ctx.db.pipelineStage.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

// ── Deal helpers (defined before leadRouter since convertToDeal uses them) ────

const DEAL_WITH_RELATIONS = {
  include: {
    contact: { select: { id: true, name: true } },
  },
} as const;

// ── Lead CRUD ─────────────────────────────────────────────────────────────────

const LEAD_WITH_STAGE = {
  include: { stage: { select: { id: true, name: true, order: true } } },
} as const;

const leadRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.lead.findMany({ orderBy: { createdAt: "desc" }, ...LEAD_WITH_STAGE });
  }),

  create: tenantProcedure
    .input(z.object({
      title: z.string().min(2),
      value: z.number().min(0).optional(),
      contactName: z.string().optional(),
      stageId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.create({ data: { tenantId: ctx.tenantId, ...input }, ...LEAD_WITH_STAGE });
    }),

  updateStage: tenantProcedure
    .input(z.object({ id: z.string(), stageId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirstOrThrow({ where: { id: input.id }, ...LEAD_WITH_STAGE });
      const updated = await ctx.db.lead.update({
        where: { id: input.id },
        data: { stageId: input.stageId },
        ...LEAD_WITH_STAGE,
      });
      const previousStatus = lead.stage?.name ?? "—";
      const newStatus = updated.stage?.name ?? "—";
      if (previousStatus !== newStatus) {
        await ctx.db.timelineEvent.create({
          data: {
            tenantId: ctx.tenantId,
            type: TimelineEventType.lead_stage_changed,
            title: updated.title,
            fromValue: previousStatus,
            toValue: newStatus,
            leadId: updated.id,
          },
        });
      }
      void eventBus.emit(crmPipelineEvents.leadStatusChanged, ctx.tenantId, {
        leadId: updated.id,
        title: updated.title,
        previousStatus,
        newStatus,
      });
      return updated;
    }),

  convertToDeal: tenantProcedure
    .input(z.object({ id: z.string(), contactId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirstOrThrow({ where: { id: input.id } });
      const deal = await ctx.db.deal.create({
        data: {
          tenantId: ctx.tenantId,
          title: lead.title,
          value: lead.value,
          leadId: lead.id,
          contactId: input.contactId,
          status: DealStatus.open,
        },
        ...DEAL_WITH_RELATIONS,
      });
      await ctx.db.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          type: TimelineEventType.deal_created,
          title: deal.title,
          toValue: DealStatus.open,
          dealId: deal.id,
          leadId: lead.id,
          contactId: input.contactId ?? null,
        },
      });
      return deal;
    }),

  // kept for backward-compat; updateStage is preferred
  updateStatus: tenantProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(LeadStatus) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.update({ where: { id: input.id }, data: { status: input.status } });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lead.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

// ── Deal CRUD ─────────────────────────────────────────────────────────────────

const dealRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.deal.findMany({
      orderBy: { createdAt: "desc" },
      ...DEAL_WITH_RELATIONS,
    });
  }),

  updateStatus: tenantProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(DealStatus) }))
    .mutation(async ({ ctx, input }) => {
      const previous = await ctx.db.deal.findFirstOrThrow({ where: { id: input.id } });
      const deal = await ctx.db.deal.update({
        where: { id: input.id },
        data: {
          status: input.status,
          closedAt: input.status !== DealStatus.open ? new Date() : null,
        },
        ...DEAL_WITH_RELATIONS,
      });
      if (previous.status !== deal.status) {
        await ctx.db.timelineEvent.create({
          data: {
            tenantId: ctx.tenantId,
            type: TimelineEventType.deal_status_changed,
            title: deal.title,
            fromValue: previous.status,
            toValue: deal.status,
            dealId: deal.id,
            contactId: deal.contactId,
          },
        });
      }
      // When won (transition into won), mark the linked Contact as "customer"
      // and notify every tenant member (in-app, deduped per deal).
      if (input.status === DealStatus.won && previous.status !== DealStatus.won) {
        if (deal.contact) {
          await ctx.db.contact.update({
            where: { id: deal.contact.id },
            data: { status: ContactStatus.customer },
          });
        }
        const members = await prismaAdmin.membership.findMany({
          where: { tenantId: ctx.tenantId },
          select: { userId: true },
        });
        if (members.length > 0) {
          const value = deal.value ? ` (€ ${deal.value.toLocaleString("it-IT")})` : "";
          await ctx.db.notification.createMany({
            data: members.map((m) => ({
              tenantId: ctx.tenantId,
              recipientId: m.userId,
              type: NotificationType.deal_won,
              message: `Deal vinto: "${deal.title}"${value}`,
              link: `/t/${ctx.tenantSlug}/crm/leads`,
              dedupeKey: `deal-won:${deal.id}`,
            })),
            skipDuplicates: true,
          });
        }
      }
      return deal;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.deal.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});

// ── Timeline (cross-module: activities + stage/status changes) ─────────────────

type TimelineActivity = Prisma.ActivityGetPayload<true>;

function mergeTimeline(activities: TimelineActivity[], events: TimelineEvent[]) {
  const items = [
    ...activities.map((a) => ({
      id: a.id,
      kind: "activity" as const,
      at: a.createdAt,
      activityType: a.type,
      title: a.title,
      status: a.status,
      priority: a.priority,
      notes: a.notes,
      dueDate: a.dueDate,
    })),
    ...events.map((e) => ({
      id: e.id,
      kind: "event" as const,
      at: e.createdAt,
      eventType: e.type,
      title: e.title,
      fromValue: e.fromValue,
      toValue: e.toValue,
    })),
  ];
  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items;
}

const timelineRouter = router({
  byContact: tenantProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deals = await ctx.db.deal.findMany({
        where: { contactId: input.contactId },
        select: { id: true, leadId: true },
      });
      const dealIds = deals.map((d) => d.id);
      const leadIds = deals.map((d) => d.leadId).filter((id): id is string => Boolean(id));
      const [activities, events] = await Promise.all([
        ctx.db.activity.findMany({
          where: {
            OR: [
              { contactId: input.contactId },
              ...(dealIds.length ? [{ dealId: { in: dealIds } }] : []),
            ],
          },
        }),
        ctx.db.timelineEvent.findMany({
          where: {
            OR: [
              { contactId: input.contactId },
              ...(dealIds.length ? [{ dealId: { in: dealIds } }] : []),
              ...(leadIds.length ? [{ leadId: { in: leadIds } }] : []),
            ],
          },
        }),
      ]);
      return mergeTimeline(activities, events);
    }),

  byDeal: tenantProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findFirstOrThrow({
        where: { id: input.dealId },
        select: { id: true, leadId: true },
      });
      const [activities, events] = await Promise.all([
        ctx.db.activity.findMany({ where: { dealId: deal.id } }),
        ctx.db.timelineEvent.findMany({
          where: {
            OR: [
              { dealId: deal.id },
              ...(deal.leadId ? [{ leadId: deal.leadId }] : []),
            ],
          },
        }),
      ]);
      return mergeTimeline(activities, events);
    }),
});

export const crmRouter = router({
  contact: contactRouter,
  tag: tagRouter,
  stage: stageRouter,
  lead: leadRouter,
  deal: dealRouter,
  timeline: timelineRouter,
});
