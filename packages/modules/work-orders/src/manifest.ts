import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "work-orders",
  version: "0.1.0",
  displayName: "Commesse",
  routes: [
    {
      path: "/work-orders",
      component: "@coordinate/modules-work-orders/pages/WorkOrdersPage",
      permissions: ["work-orders:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Commesse",
      path: "/work-orders",
      icon: "Hammer",
      section: "operations",
      order: 55,
      permissions: ["work-orders:read"],
    },
  ],
  permissions: ["work-orders:read", "work-orders:write", "work-orders:delete"],
};
