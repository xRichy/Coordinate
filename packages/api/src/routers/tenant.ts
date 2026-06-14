import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { requirePermission } from "../middleware/permission";

/**
 * Catalog of core modules the operator can enable/disable per tenant.
 * Kept in sync with the module manifests (packages/modules/<id>).
 */
export const MODULE_CATALOG = [
  { id: "dashboard", label: "Dashboard", description: "Panoramica e widget" },
  { id: "crm-contacts", label: "Contatti", description: "Anagrafica persone e aziende" },
  { id: "crm-pipeline", label: "Pipeline", description: "Lead e deal commerciali" },
  { id: "activities", label: "Attività", description: "Task, chiamate, riunioni, note" },
  { id: "warehouse", label: "Magazzino", description: "Prodotti e movimenti di stock" },
  { id: "calendar", label: "Calendario", description: "Vista mese/settimana delle attività" },
  { id: "quotes", label: "Preventivi", description: "Offerte a righe con totali, IVA e stati" },
  { id: "work-orders", label: "Commesse", description: "Ordini di lavoro con stato e scadenze" },
] as const;

const MODULE_IDS = new Set<string>(MODULE_CATALOG.map((m) => m.id));

export const tenantRouter = router({
  modules: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: ctx.tenantId },
        select: { enabledModules: true },
      });
      return { catalog: MODULE_CATALOG, enabled: tenant.enabledModules };
    }),

    setEnabled: tenantProcedure
      .use(requirePermission("tenant:settings:write"))
      .input(z.object({ modules: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        // Sanitize: keep only known module ids, deduped.
        const modules = [...new Set(input.modules.filter((m) => MODULE_IDS.has(m)))];
        const updated = await ctx.db.tenant.update({
          where: { id: ctx.tenantId },
          data: { enabledModules: modules },
          select: { enabledModules: true },
        });
        return updated.enabledModules;
      }),
  }),
});
