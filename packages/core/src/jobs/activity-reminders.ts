import { inngest } from "./client";
import { prismaAdmin, NotificationType } from "@coordinate/database";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Hourly job: scan activities whose dueDate falls within the next 24h and are
 * not yet done, and create an in-app reminder notification for every member of
 * the activity's tenant.
 *
 * Runs cross-tenant via prismaAdmin (bypasses RLS). Idempotent: a unique
 * dedupeKey per (recipient, activity) means re-runs while an activity stays
 * in-window never duplicate the reminder. The email variant is deferred until
 * Resend is wired (single-domain-tasks T3.10 / T7.2).
 */
export const activityReminders = inngest.createFunction(
  {
    id: "activity-reminders",
    triggers: [{ cron: "0 * * * *" }], // ogni ora
  },
  async ({ step }) => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    return step.run("create-due-activity-reminders", async () => {
      const dueActivities = await prismaAdmin.activity.findMany({
        where: {
          dueDate: { gte: now, lte: windowEnd },
          status: { not: "done" },
        },
        select: { id: true, title: true, tenantId: true, dueDate: true },
      });

      if (dueActivities.length === 0) {
        return { dueActivities: 0, notificationsCreated: 0 };
      }

      const tenantIds = [...new Set(dueActivities.map((a) => a.tenantId))];

      const [tenants, memberships] = await Promise.all([
        prismaAdmin.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, slug: true },
        }),
        prismaAdmin.membership.findMany({
          where: { tenantId: { in: tenantIds } },
          select: { tenantId: true, userId: true },
        }),
      ]);

      const slugByTenant = new Map(tenants.map((t) => [t.id, t.slug]));
      const membersByTenant = new Map<string, string[]>();
      for (const m of memberships) {
        const list = membersByTenant.get(m.tenantId) ?? [];
        list.push(m.userId);
        membersByTenant.set(m.tenantId, list);
      }

      const rows = dueActivities.flatMap((activity) => {
        const recipients = membersByTenant.get(activity.tenantId) ?? [];
        const slug = slugByTenant.get(activity.tenantId);
        return recipients.map((recipientId) => ({
          tenantId: activity.tenantId,
          recipientId,
          type: NotificationType.activity_reminder,
          message: `Promemoria: l'attività "${activity.title}" è in scadenza.`,
          link: slug ? `/t/${slug}/tasks` : null,
          dedupeKey: `activity-reminder:${activity.id}`,
        }));
      });

      const result = await prismaAdmin.notification.createMany({
        data: rows,
        skipDuplicates: true, // honours the (tenantId, recipientId, dedupeKey) unique index
      });

      return { dueActivities: dueActivities.length, notificationsCreated: result.count };
    });
  }
);
