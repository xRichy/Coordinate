import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "crm-contacts",
  version: "0.1.0",
  displayName: "CRM — Contatti",
  routes: [
    {
      path: "/crm/customers",
      component: "@coordinate/modules-crm-contacts/pages/CustomersPage",
      permissions: ["crm:contact:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Customers",
      path: "/crm/customers",
      icon: "Users",
      section: "crm",
      order: 10,
      permissions: ["crm:contact:read"],
    },
  ],
  permissions: ["crm:contact:read", "crm:contact:write", "crm:contact:delete"],
};
