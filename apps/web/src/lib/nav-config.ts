import { manifest as crmContactsManifest } from "@coordinate/modules-crm-contacts";
import { manifest as crmPipelineManifest } from "@coordinate/modules-crm-pipeline";
import { manifest as activitiesManifest } from "@coordinate/modules-activities";
import { manifest as warehouseManifest } from "@coordinate/modules-warehouse";
import type { NavigationItem } from "@coordinate/core/module-registry";

const CORE_NAV: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard", section: "core", order: 0 },
];

const MODULE_MANIFESTS = [
  crmContactsManifest,
  crmPipelineManifest,
  activitiesManifest,
  warehouseManifest,
];

export const NAV_ITEMS: NavigationItem[] = [
  ...CORE_NAV,
  ...MODULE_MANIFESTS.flatMap((m) => m.navigation),
].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
