import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "dashboard",
  version: "0.1.0",
  displayName: "Dashboard",
  routes: [
    {
      path: "/dashboard",
      component: "@coordinate/modules-dashboard/pages/DashboardPage",
      permissions: ["dashboard:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "LayoutDashboard",
      section: "core",
      order: 0,
      permissions: ["dashboard:read"],
    },
  ],
  permissions: ["dashboard:read"],
};
