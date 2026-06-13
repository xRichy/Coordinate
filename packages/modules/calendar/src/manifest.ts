import type { ModuleManifest } from "@coordinate/core/module-registry";

export const manifest: ModuleManifest = {
  id: "calendar",
  version: "0.1.0",
  displayName: "Calendario",
  dependsOn: ["activities"],
  routes: [
    {
      path: "/calendar",
      component: "@coordinate/modules-calendar/pages/CalendarPage",
      permissions: ["calendar:read"],
      layout: "sidebar",
    },
  ],
  navigation: [
    {
      label: "Calendario",
      path: "/calendar",
      icon: "Calendar",
      section: "main",
      order: 35,
      permissions: ["calendar:read"],
    },
  ],
  permissions: ["calendar:read", "calendar:write"],
};
