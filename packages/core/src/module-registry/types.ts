import type { Role } from "../permissions";

// ── Routing ───────────────────────────────────────────────────────────────────

/** A single route contribution declared by a module. */
export interface ModuleRoute {
  /** URL path served by this route (e.g. '/crm/customers'). Must start with '/'. */
  path: string;
  /**
   * Absolute import path to the Next.js page component.
   * Used by the build-time route generation script to emit re-export stubs.
   */
  component: string;
  /** Permissions required to access this route. Any one match is sufficient. */
  permissions?: string[];
  /** Controls whether the route renders inside the app shell. Defaults to 'sidebar'. */
  layout?: "full" | "sidebar";
}

// ── Navigation ────────────────────────────────────────────────────────────────

/** A sidebar navigation entry injected by a module when it is active. */
export interface NavigationItem {
  /** i18n key used to resolve the display label (e.g. 'nav.crm.customers'). */
  label: string;
  /** Target href. Must match one of the module's declared route paths. */
  path: string;
  /** Lucide icon name or absolute import path to a custom icon component. */
  icon: string;
  /** Sidebar section identifier for visual grouping (e.g. 'crm', 'operations'). */
  section?: string;
  /** Render order within the section. Lower values appear first. Defaults to 100. */
  order?: number;
  /** Permissions required to see this item. Item is hidden when none match. */
  permissions?: string[];
}

// ── Events ────────────────────────────────────────────────────────────────────

/** Declares a subscription to an internal event bus event. */
export interface EventHandlerDeclaration {
  /** Event name to subscribe to (e.g. 'lead.status.changed'). */
  event: string;
  /**
   * Absolute import path to the async handler function.
   * Signature: `(payload: EventPayload, ctx: { tenantId: string }) => Promise<void>`
   */
  handler: string;
}

// ── Custom fields ─────────────────────────────────────────────────────────────

/** Declares that a module entity supports tenant-defined custom fields. */
export interface CustomFieldsExtension {
  /**
   * Entity type identifier as used in the `CustomFieldDefinition` table
   * (e.g. 'contact', 'deal', 'product').
   */
  entityType: string;
  /** Custom field value types allowed for this entity. */
  supportedFieldTypes: Array<"text" | "number" | "date" | "dropdown" | "boolean">;
}

// ── Manifest ──────────────────────────────────────────────────────────────────

/**
 * A tRPC sub-router exported by a module.
 * Typed as a permissive record here to avoid a hard dependency on `@trpc/server`
 * inside `@coordinate/core`. Cast to `AnyRouter` from `@trpc/server` in the
 * registry implementation when merging routers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModuleApiRouter = Record<string, any>;

/**
 * Full declaration of a Coordinate module.
 * Every module (core or tenant-specific) must export one of these as its
 * default or named export so the module registry can discover it.
 */
export interface ModuleManifest {
  /**
   * Globally unique module identifier.
   * Use reverse-domain dot notation for tenant-specific modules
   * (e.g. 'crm', 'warehouse', 'acme.fleet-management').
   */
  id: string;
  /** Semantic version of the module (e.g. '1.0.0'). */
  version: string;
  /**
   * User-facing module name.
   * Pass an i18n key (e.g. 'modules.crm.displayName') or a plain English
   * string for built-in modules that do not yet have translations.
   */
  displayName: string;
  /**
   * IDs of other modules that must be registered and active before this
   * module can load. The registry validates this at registration time.
   */
  dependsOn?: string[];
  /**
   * App Router route contributions.
   * The `prebuild` script reads these to generate page stubs under
   * `apps/web/src/app/(modules)/`.
   */
  routes: ModuleRoute[];
  /** Sidebar navigation entries injected when this module is active for a tenant. */
  navigation: NavigationItem[];
  /**
   * Atomic permission strings this module introduces.
   * Convention: `'<module-id>:<entity>:<action>'`
   * Examples: `'crm:contact:write'`, `'warehouse:product:delete'`.
   * These are merged with the global Permission union at runtime.
   */
  permissions: string[];
  /**
   * Relative path (from the module root) to the Prisma schema fragment file.
   * The database build script merges all fragments into the base schema before
   * running `prisma generate`.
   * Example: `'./src/prisma/schema.fragment.prisma'`
   */
  prismaSchema?: string;
  /**
   * Relative path (from the module root) to the migrations directory.
   * Used by the merge-schemas script to apply module-level migrations.
   */
  migrations?: string;
  /**
   * The tRPC sub-router exported by this module.
   * Mounted under the module id in the merged app router
   * (e.g. `appRouter.crm`, `appRouter.warehouse`).
   */
  apiRouter?: ModuleApiRouter;
  /**
   * Internal event bus subscriptions.
   * The registry wires these up after all modules are loaded so modules
   * react to each other's events without direct imports.
   */
  eventHandlers?: EventHandlerDeclaration[];
  /**
   * Entity types within this module that tenants can extend with custom fields.
   * The custom fields system reads these to build the available entity list in
   * the admin settings UI.
   */
  customFieldsExtensions?: CustomFieldsExtension[];
  /**
   * Absolute import path to the React component rendered on the module's
   * settings page inside the tenant admin area.
   * Example: `'@coordinate/modules-crm/src/pages/CrmSettingsPage'`
   */
  settingsPage?: string;
}

// ── Registry types ────────────────────────────────────────────────────────────

/** Lifecycle status of a module tracked by the registry at runtime. */
export type ModuleStatus = "active" | "inactive" | "error";

/**
 * A registered module: the original manifest enriched with runtime metadata
 * added by the registry after it processes the manifest.
 */
export interface RegisteredModule extends ModuleManifest {
  /** Current lifecycle status of this module in the registry. */
  status: ModuleStatus;
  /** If `status === 'error'`, the error that caused registration to fail. */
  error?: Error;
  /** Unix timestamp (ms) when the module was registered. */
  registeredAt: number;
}

/**
 * Minimal user context required to filter navigation items and gate routes
 * by permission.
 */
export interface NavigationUser {
  /** User's unique ID (matches Better-Auth user.id). */
  id: string;
  /** The user's role within the current tenant. */
  role: Role;
  /** Fully-expanded list of permission strings for this user in this tenant. */
  permissions: string[];
}

/** Tenant context used when building the per-request tRPC router or navigation. */
export interface TenantContext {
  /** Tenant's unique database ID. */
  id: string;
  /** Tenant's URL slug (used for subdomain routing). */
  slug: string;
  /**
   * IDs of modules currently enabled for this tenant.
   * Only modules whose id appears here are mounted in the router and navigation.
   */
  enabledModuleIds: string[];
}

/**
 * The module registry contract.
 *
 * The registry is the single source of truth for which modules are loaded and
 * which are enabled per tenant. Call `register()` once per module at app
 * startup; then use the query methods per-request.
 *
 * Implementation: `packages/core/src/module-registry/registry.ts` (T2.2).
 */
export interface ModuleRegistry {
  /**
   * Register a module manifest.
   *
   * @throws if the id is already registered (duplicate).
   * @throws if any `dependsOn` id is not yet registered (dependency not found).
   * @throws if adding this module would create a dependency cycle.
   */
  register(manifest: ModuleManifest): void;

  /**
   * Returns all registered modules whose id is listed in
   * `tenant.enabledModuleIds` and whose status is `'active'`.
   */
  getEnabledModules(tenantId: string): RegisteredModule[];

  /**
   * Builds a merged tRPC router from the `apiRouter` of every module enabled
   * for the given tenant. The result is mounted as the tenant-scoped app router.
   */
  getApiRouter(tenant: TenantContext): ModuleApiRouter;

  /**
   * Returns the sidebar navigation items visible to `user` within `tenant`.
   * Items are filtered by:
   *  1. The module must be active and enabled for the tenant.
   *  2. The user must hold at least one of the item's required permissions.
   * Results are sorted by section, then by `order`.
   */
  getNavigation(user: NavigationUser, tenant: TenantContext): NavigationItem[];
}
