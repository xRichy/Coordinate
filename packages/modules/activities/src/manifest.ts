import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "activities",
  version: "0.1.0",
  displayName: "Attività",
  routes: [
    {
      path: "/tasks",
      component: "@coordinate/modules-activities/pages/ActivitiesPage",
      permissions: ["activities:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Attività",
      path: "/tasks",
      icon: "CheckSquare",
      section: "main",
      order: 30,
      permissions: ["activities:read"],
    },
  ],
  permissions: ["activities:read", "activities:write", "activities:delete"],
};
