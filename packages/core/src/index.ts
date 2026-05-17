export { can } from "./permissions";
export type { Role, Permission } from "./permissions";

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
} from "./module-registry";

export { ModuleRegistryImpl, moduleRegistry, loadModules } from "./module-registry";
