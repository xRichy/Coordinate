import { z } from "zod";
import { defineTenantEvent } from "./bus";

export const leadStatusChanged = defineTenantEvent(
  "lead.status.changed",
  z.object({
    leadId: z.string(),
    title: z.string(),
    previousStatus: z.string(),
    newStatus: z.string(),
  })
);
