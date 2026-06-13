import { inngest } from "./client";
import { prismaAdmin } from "@coordinate/database";

export const purgeDeletedContacts = inngest.createFunction(
  {
    id: "purge-deleted-contacts",
    triggers: [{ cron: "0 3 * * *" }], // ogni notte alle 03:00 UTC
  },
  async ({ step }) => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 giorni fa

    const result = await step.run("hard-delete-expired-contacts", async () => {
      const deleted = await prismaAdmin.contact.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
      return { count: deleted.count };
    });

    return result;
  }
);
