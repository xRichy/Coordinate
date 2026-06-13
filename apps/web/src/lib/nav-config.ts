import { manifest as dashboardManifest } from "@coordinate/modules-dashboard";
import { manifest as crmContactsManifest } from "@coordinate/modules-crm-contacts";
import { manifest as crmPipelineManifest } from "@coordinate/modules-crm-pipeline";
import { manifest as activitiesManifest } from "@coordinate/modules-activities";
import { manifest as warehouseManifest } from "@coordinate/modules-warehouse";
import { manifest as calendarManifest } from "@coordinate/modules-calendar";
import type { NavigationItem } from "@coordinate/core/module-registry";

const MODULE_MANIFESTS = [
  dashboardManifest,
  crmContactsManifest,
  crmPipelineManifest,
  activitiesManifest,
  warehouseManifest,
  calendarManifest,
];

/** A nav item enriched with the id of the module that contributes it. */
export type NavItem = NavigationItem & { moduleId: string };

export const NAV_ITEMS: NavItem[] = MODULE_MANIFESTS
  .flatMap((m) => m.navigation.map((n) => ({ ...n, moduleId: m.id })))
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
