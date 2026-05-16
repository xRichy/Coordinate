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
pnpm -F @coordinate/web build
```

There are no tests currently set up in this project.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Tailwind CSS 4** + **Shadcn/UI** (New York style, CSS variables) for all UI components
- **Zustand** for global client-side state (all app data lives here — no server calls yet)
- **Prisma** + PostgreSQL (schema is minimal; DB is not yet wired to the UI)
- **Socket.io** installed but not yet used
- **Framer Motion**, **Recharts**, **Sonner** (toasts), **React Hook Form** + **Zod**
- **Turborepo** + **pnpm workspaces** for monorepo orchestration

## Monorepo Structure

```
apps/
  web/              ← Next.js app (@coordinate/web)
packages/
  ui/               ← Shared UI components (@coordinate/ui)
  core/             ← Business logic, auth, events (@coordinate/core)
  database/         ← Prisma client + DB helpers (@coordinate/database)
  api/              ← tRPC router definitions (@coordinate/api)
  config/           ← Shared tsconfig and tooling config (@coordinate/config)
tenants/            ← Tenant-specific module overrides (future)
```

All packages use `pnpm-workspace.yaml` and are orchestrated by `turbo.json`.

## Architecture

This is a SaaS MVP in active development. The frontend is fully implemented; the backend is being added incrementally (Fase 1+).

**App code lives in `apps/web/`:**
- `apps/web/src/app/layout.tsx` — root layout wrapping `ThemeProvider`, `SidebarProvider`, `TooltipProvider`, `Toaster`
- `apps/web/src/components/layout/MainLayout.tsx` — conditionally shows `AppSidebar` and `AppHeader` (hidden on `/login`)
- Each module is a folder under `apps/web/src/app/` with its own pages

**Navigation modules (sidebar routes):**
- `/dashboard` — KPI cards + Recharts area/bar charts
- `/crm/customers` — customer table with add/edit modals
- `/crm/leads` — Kanban board across 6 stages
- `/tasks` — task table with priority/status management
- `/warehouse` — inventory table + stock movement history

**State:** `apps/web/src/store/useAppStore.ts` holds all mock entities (customers, leads, tasks, products, stock movements). Will be replaced by tRPC + TanStack Query in Fase 1.

**Path aliases:**
- `@/*` maps to `apps/web/src/*` (internal imports)
- `@coordinate/ui`, `@coordinate/core`, etc. map to the respective packages

**Adding UI components:** Use `pnpm -F @coordinate/web exec npx shadcn@latest add <component>` — placed in `apps/web/src/components/ui/`.

**Theme:** Dark/light mode via `next-themes`. Use CSS variables (`--primary`, `--card`, `--border`, etc.) rather than hardcoded colors. Toggle component is `apps/web/src/components/theme-toggle.tsx`.

**Not yet implemented:** API routes, real database queries, authentication middleware, WebSocket real-time features. See `guides/implementation-tasks.md` for the full roadmap.
