import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "warehouse",
  version: "0.1.0",
  displayName: "Magazzino",
  routes: [
    {
      path: "/warehouse",
      component: "@coordinate/modules-warehouse/pages/WarehousePage",
      permissions: ["warehouse:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Magazzino",
      path: "/warehouse",
      icon: "Package",
      section: "main",
      order: 40,
      permissions: ["warehouse:read"],
    },
  ],
  permissions: ["warehouse:read", "warehouse:write", "warehouse:delete"],
};
