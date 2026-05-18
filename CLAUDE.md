# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start development server (all packages via Turborepo, Next.js on port 3000)
pnpm build         # Production build (all packages)
pnpm lint          # ESLint check (all packages)
pnpm typecheck     # TypeScript check (all packages)
pnpm clean         # Remove build artifacts (all packages)

# Run a command in a specific package:
pnpm -F @coordinate/web dev
pnpm -F @coordinate/core test
pnpm -F @coordinate/database db:migrate
pnpm -F @coordinate/database db:seed
```

Tests live in the packages that have them (`@coordinate/core`, `@coordinate/database` use Vitest).

## Product context

Coordinate is a **boutique modular platform** built for a small number of clients (~5 total target). Not a public SaaS — vendita white-glove, tenant creati manualmente, fatturazione tramite contratto + canone annuale + setup fee per moduli custom. Vedi `guides/mvp-scope.md` e `guides/pricing.md` per il contesto strategico.

Ogni cliente ha una mix di moduli **core** (condivisi) e moduli **custom** (scritti su misura per lui). Architetturalmente, core e custom sono identici: la differenza è solo quale tenant li ha in `TenantConfig.enabledModules`.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Tailwind CSS 4** + **Shadcn/UI** (New York style, CSS variables)
- **Better-Auth** with `organizations` plugin (= tenants)
- **Prisma 6** + PostgreSQL with Row-Level Security
- **tRPC** end-to-end type-safety
- **TanStack Query** for server state (via tRPC), **Zustand** only for UI state
- **Inngest** for background jobs
- **Sentry** + **PostHog** for observability (both no-op if env vars not set)
- **Framer Motion**, **Recharts**, **Sonner**, **React Hook Form** + **Zod**
- **Turborepo** + **pnpm workspaces** monorepo

Installed but unused: Socket.io (in `apps/web` deps, not wired anywhere — real-time features deferred).

Deferred (will be added if/when needed): Stripe (boutique uses manual invoicing), Resend (no transactional emails at launch), next-intl (italian only at launch).

## Monorepo Structure

```
apps/
  web/                  ← Next.js app (@coordinate/web)
packages/
  ui/                   ← Shared UI components (@coordinate/ui)
  core/                 ← Business logic, auth, module-registry (@coordinate/core)
  database/             ← Prisma client + RLS helpers (@coordinate/database)
  api/                  ← tRPC root router (@coordinate/api)
  config/               ← Shared tsconfig (@coordinate/config)
  modules/              ← Individual modules (created in Fase 2.5+)
    crm-contacts/       ← e.g. core CRM module
    acme-fleet/         ← e.g. custom module for client "acme"
```

> **Note**: an empty `tenants/` folder exists from T0.2 but is no longer used — custom modules per client live in `packages/modules/<client>-<feature>/` like any other module (vedi `guides/architecture.md` §6).

`pnpm-workspace.yaml` enumerates `apps/*`, `packages/*`, `packages/modules/*`. Turborepo orchestrates builds via `turbo.json`.

## Architecture

The platform is multi-tenant, isolated via Postgres Row-Level Security. Tenant identification is via subdomain (`acme.coordinate.app`, in dev `acme.lvh.me:3000`). Vedi `guides/architecture.md` per il dettaglio.

**Current state**:
- ✅ Fase 0 complete (monorepo)
- ✅ Fase 1 complete (auth + multi-tenant + tRPC + RLS + Inngest + Sentry/PostHog)
- 🚧 Fase 2 in progress (module-registry built; module migration in corso)

**Module system** (`packages/core/src/module-registry/`):
- `types.ts` — `ModuleManifest`, `RegisteredModule`, `ModuleRegistry` interface
- `registry.ts` — `ModuleRegistryImpl` + `moduleRegistry` singleton
- `loader.ts` — filesystem discovery of `packages/modules/*`

**App code lives in `apps/web/`:**
- `apps/web/src/app/layout.tsx` — root layout wrapping providers
- `apps/web/src/middleware.ts` — extracts subdomain → resolves tenant → injects `x-tenant-slug` header
- `apps/web/src/app/api/trpc/[trpc]/route.ts` — tRPC handler
- `apps/web/src/app/api/auth/[...all]/route.ts` — Better-Auth handler
- `apps/web/src/app/api/inngest/route.ts` — Inngest webhook
- Page routes still under `apps/web/src/app/` until modules are migrated (T2.5–T2.10)

**Auth & sessions**:
- Better-Auth at `packages/core/src/auth/index.ts`
- Cross-subdomain cookies configured via `BETTER_AUTH_COOKIE_DOMAIN`
- 4 RBAC roles (`owner`, `admin`, `member`, `viewer`) in `packages/core/src/permissions/`
- tRPC procedures: `publicProcedure`, `protectedProcedure`, `tenantProcedure` (auto-wraps with `withTenant()`)

**Database**:
- Schema in `packages/database/prisma/schema.prisma` (single file, sections demarcated by `// ── module-name ──` comments — no schema merge pipeline)
- RLS migration enforces `tenant_id = current_setting('app.tenant_id')::uuid` on all multi-tenant tables
- `withTenant(tenantId, callback)` helper acquires a connection, sets `app.tenant_id`, runs the callback
- Seed: `pnpm -F @coordinate/database db:seed` populates the demo tenant

**Path aliases**:
- `@/*` → `apps/web/src/*` (internal imports)
- `@coordinate/ui`, `@coordinate/core`, `@coordinate/database`, `@coordinate/api` → respective packages
- `@coordinate/core/auth`, `@coordinate/core/tenant`, `@coordinate/core/jobs`, `@coordinate/core/analytics`, `@coordinate/core/module-registry` → core subpath exports

**Adding UI components**: `pnpm -F @coordinate/web exec npx shadcn@latest add <component>` — placed in `apps/web/src/components/ui/`.

**Theming**: Dark/light global via `next-themes`. Per-tenant branding (logo + primary color) via CSS variables, injected by `<TenantThemeProvider>` (built in Fase 5, T5.3).

## Task & branch workflow

When asked to execute a task from `guides/implementation-tasks.md`:
1. Read the task spec entirely + read `guides/task-workflow.md` for git rules
2. Verify dependencies are ✅ in the global state
3. Branch off `develop`: `feat/t<x>-<y>/<slug>` (or `fix/`, `chore/`, `docs/`)
4. Execute only what the task specifies — bug correlati vanno in `guides/known-issues.md`
5. Verify every "Done when" criterion explicitly
6. Update task state in `implementation-tasks.md` as the last commit
7. Push the branch and **stop** — never merge to `develop` or `main`
8. Deliver a structured report to the user

Tasks marked **⏭ DEFERRED** or **❌ REMOVED** must NOT be executed without first removing the marker and updating strategy.
