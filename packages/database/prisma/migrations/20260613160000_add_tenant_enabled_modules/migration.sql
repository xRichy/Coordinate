-- Per-tenant enabled modules (boutique model: operator decides modules per client).
-- Existing tenants default to all core modules enabled.
ALTER TABLE "Tenant" ADD COLUMN "enabledModules" TEXT[] NOT NULL
  DEFAULT ARRAY['dashboard', 'crm-contacts', 'crm-pipeline', 'activities', 'warehouse', 'calendar']::TEXT[];
