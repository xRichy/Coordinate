import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { moduleRegistry } from "./registry";
import type { ModuleManifest } from "./types";

// packages/core/src/module-registry/ → 4 levels up → repo root
const LOADER_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(LOADER_DIR, "..", "..", "..", "..");
const MODULES_DIR = join(REPO_ROOT, "packages", "modules");
const TENANTS_DIR = join(REPO_ROOT, "tenants");

/**
 * Attempt to load a `ModuleManifest` from the given module directory.
 * Tries `src/manifest.ts` first (source, for tsx context), then
 * `dist/manifest.js` (compiled, for production Node.js).
 * Returns `null` if no manifest is found or the import fails.
 *
 * NOTE: dynamic import of `.ts` files requires the loader to be executed via
 * `tsx` (or equivalent). In compiled Next.js bundles this loader is never
 * called directly — modules are wired at build time by `generate-routes.ts`.
 */
async function loadManifest(moduleDir: string): Promise<ModuleManifest | null> {
  const candidates = [
    join(moduleDir, "src", "manifest.ts"),
    join(moduleDir, "src", "manifest.js"),
    join(moduleDir, "dist", "manifest.js"),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const mod = await import(candidate);
      // Accept either a named `manifest` export or the default export.
      const manifest: unknown =
        (mod as Record<string, unknown>)["manifest"] ??
        (mod as Record<string, unknown>)["default"] ??
        null;
      if (manifest && typeof manifest === "object" && "id" in manifest) {
        return manifest as ModuleManifest;
      }
    } catch {
      // Not a valid manifest — skip silently.
    }
  }

  return null;
}

/**
 * Discover and register all modules from:
 * - `packages/modules/*` — core platform modules
 * - `tenants/<slug>/modules/*` — tenant-specific custom modules
 *
 * Modules that share a dependency must be registered in topological order
 * (dependencies before dependents). Directory enumeration order is used, so
 * name core modules with numeric prefixes if ordering matters
 * (e.g. `01-crm-contacts`, `02-crm-pipeline`).
 *
 * Call this once at server startup (or in the prebuild script) before the
 * tRPC router is assembled.
 */
export async function loadModules(): Promise<void> {
  // Core modules
  if (existsSync(MODULES_DIR)) {
    const entries = readdirSync(MODULES_DIR, { withFileTypes: true });
    for (const entry of entries.filter((e) => e.isDirectory())) {
      const manifest = await loadManifest(join(MODULES_DIR, entry.name));
      if (manifest) {
        moduleRegistry.register(manifest);
      }
    }
  }

  // Tenant-specific modules
  if (existsSync(TENANTS_DIR)) {
    const tenants = readdirSync(TENANTS_DIR, { withFileTypes: true });
    for (const tenant of tenants.filter((e) => e.isDirectory())) {
      const tenantModulesDir = join(TENANTS_DIR, tenant.name, "modules");
      if (!existsSync(tenantModulesDir)) continue;

      const modules = readdirSync(tenantModulesDir, { withFileTypes: true });
      for (const mod of modules.filter((e) => e.isDirectory())) {
        const manifest = await loadManifest(
          join(tenantModulesDir, mod.name)
        );
        if (manifest) {
          moduleRegistry.register(manifest);
        }
      }
    }
  }
}
