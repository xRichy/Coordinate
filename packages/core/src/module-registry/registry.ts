import type {
  ModuleManifest,
  ModuleRegistry,
  ModuleApiRouter,
  NavigationItem,
  NavigationUser,
  RegisteredModule,
  TenantContext,
} from "./types";

// ── Cycle detection ───────────────────────────────────────────────────────────

/**
 * DFS-based cycle detection over the full dependency graph.
 * Because registration requires all dependencies to already be present,
 * true cycles are impossible in practice — this guard exists as a safety net
 * for programmatic (bulk) registration scenarios.
 */
function assertNoCycles(
  graph: Map<string, string[]>,
  startNode: string
): void {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);
    for (const dep of graph.get(node) ?? []) {
      if (!visited.has(dep)) {
        if (dfs(dep)) return true;
      } else if (inStack.has(dep)) {
        return true;
      }
    }
    inStack.delete(node);
    return false;
  }

  if (dfs(startNode)) {
    throw new Error(
      `Dependency cycle detected involving module '${startNode}'`
    );
  }
}

// ── Registry implementation ───────────────────────────────────────────────────

export class ModuleRegistryImpl implements ModuleRegistry {
  private readonly modules = new Map<string, RegisteredModule>();

  register(manifest: ModuleManifest): void {
    if (this.modules.has(manifest.id)) {
      throw new Error(
        `Module '${manifest.id}' is already registered. Each module id must be unique.`
      );
    }

    for (const dep of manifest.dependsOn ?? []) {
      if (!this.modules.has(dep)) {
        throw new Error(
          `Module '${manifest.id}' depends on '${dep}', which is not registered. ` +
            `Register dependencies before their dependents.`
        );
      }
    }

    // Build graph snapshot including the new module, then check for cycles.
    const graph = new Map<string, string[]>();
    for (const [id, mod] of this.modules) {
      graph.set(id, mod.dependsOn ?? []);
    }
    graph.set(manifest.id, manifest.dependsOn ?? []);
    assertNoCycles(graph, manifest.id);

    this.modules.set(manifest.id, {
      ...manifest,
      status: "active",
      registeredAt: Date.now(),
    });
  }

  /**
   * Returns all registered active modules.
   *
   * Per-tenant enablement (filtering by `TenantConfig.enabledModules`) is
   * wired in T4.10. Until then every registered module is treated as enabled
   * for all tenants.
   */
  getEnabledModules(_tenantId: string): RegisteredModule[] {
    return Array.from(this.modules.values()).filter(
      (m) => m.status === "active"
    );
  }

  /**
   * Returns a plain object `{ [moduleId]: apiRouter }` for all modules whose
   * id appears in `tenant.enabledModuleIds`. The caller (typically
   * `@coordinate/api`) merges these into the tRPC app router.
   */
  getApiRouter(tenant: TenantContext): ModuleApiRouter {
    const result: ModuleApiRouter = {};
    for (const mod of this.getModulesForTenant(tenant)) {
      if (mod.apiRouter) {
        result[mod.id] = mod.apiRouter;
      }
    }
    return result;
  }

  getNavigation(user: NavigationUser, tenant: TenantContext): NavigationItem[] {
    const items: NavigationItem[] = [];

    for (const mod of this.getModulesForTenant(tenant)) {
      for (const item of mod.navigation) {
        const required = item.permissions ?? [];
        const visible =
          required.length === 0 ||
          required.some((p) => user.permissions.includes(p));
        if (visible) {
          items.push(item);
        }
      }
    }

    return items.sort((a, b) => {
      const sA = a.section ?? "";
      const sB = b.section ?? "";
      if (sA !== sB) return sA.localeCompare(sB);
      return (a.order ?? 100) - (b.order ?? 100);
    });
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private getModulesForTenant(tenant: TenantContext): RegisteredModule[] {
    const { enabledModuleIds } = tenant;
    return Array.from(this.modules.values()).filter(
      (m) => m.status === "active" && enabledModuleIds.includes(m.id)
    );
  }
}

/** Application-wide singleton. Import this in server startup code. */
export const moduleRegistry = new ModuleRegistryImpl();
