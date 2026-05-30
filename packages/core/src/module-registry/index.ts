export type {
  ModuleRoute,
  NavigationItem,
  EventHandlerDeclaration,
  CustomFieldsExtension,
  ModuleApiRouter,
  ModuleManifest,
  ModuleStatus,
  RegisteredModule,
  NavigationUser,
  TenantContext,
  ModuleRegistry,
} from "./types";

export { ModuleRegistryImpl, moduleRegistry } from "./registry";
// loadModules (./loader.ts) is server-only (uses node:fs) — import directly
// from "@coordinate/core/src/module-registry/loader" in server-only code.
