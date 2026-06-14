import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "quotes",
  version: "0.1.0",
  displayName: "Preventivi",
  routes: [
    {
      path: "/quotes",
      component: "@coordinate/modules-quotes/pages/QuotesPage",
      permissions: ["quotes:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Preventivi",
      path: "/quotes",
      icon: "FileText",
      section: "operations",
      order: 50,
      permissions: ["quotes:read"],
    },
  ],
  permissions: ["quotes:read", "quotes:write", "quotes:delete"],
};
