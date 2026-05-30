import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "crm-pipeline",
  version: "0.1.0",
  displayName: "CRM — Pipeline",
  routes: [
    {
      path: "/crm/leads",
      component: "@coordinate/modules-crm-pipeline/pages/LeadsPage",
      permissions: ["crm:lead:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Pipeline",
      path: "/crm/leads",
      icon: "Kanban",
      section: "crm",
      order: 20,
      permissions: ["crm:lead:read"],
    },
  ],
  permissions: ["crm:lead:read", "crm:lead:write", "crm:lead:delete"],
};
