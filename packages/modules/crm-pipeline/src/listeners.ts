import { eventBus, crmPipelineEvents } from "@coordinate/core/events";

/**
 * Subscribe to crm-pipeline events.
 * Call once at app startup (e.g. in the module loader).
 */
export function registerCrmPipelineListeners(): () => void {
  const unsubscribe = eventBus.on(crmPipelineEvents.leadStatusChanged, ({ tenantId, payload }) => {
    // In production this could write an AuditLog, trigger a notification, etc.
    console.log(
      `[crm-pipeline] lead.status.changed tenant=${tenantId} lead=${payload.leadId} ` +
      `"${payload.title}" ${payload.previousStatus} → ${payload.newStatus}`
    );
  });

  return unsubscribe;
}
