# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (Next.js on port 3000)
npm run build      # Production build
npm run lint       # ESLint check
npm run start      # Start production server
```

There are no tests currently set up in this project.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript 5
- **Tailwind CSS 4** + **Shadcn/UI** (New York style, CSS variables) for all UI components
- **Zustand** for global client-side state (all app data lives here — no server calls yet)
- **Prisma** + PostgreSQL (schema is minimal; DB is not yet wired to the UI)
- **Socket.io** installed but not yet used
- **Framer Motion**, **Recharts**, **Sonner** (toasts), **React Hook Form** + **Zod**

## Architecture

This is a portfolio SaaS demo with a fully implemented frontend and no backend yet. All data is mock data stored in Zustand (`src/store/useAppStore.ts`).

**App Router layout:**
- `src/app/layout.tsx` — root layout wrapping `ThemeProvider`, `SidebarProvider`, `TooltipProvider`, `Toaster`
- `src/components/layout/MainLayout.tsx` — conditionally shows `AppSidebar` and `AppHeader` (hidden on `/login`)
- Each module is a folder under `src/app/` with its own pages

**Navigation modules (sidebar routes):**
- `/dashboard` — KPI cards + Recharts area/bar charts
- `/crm/customers` — customer table with add/edit modals
- `/crm/leads` — Kanban board across 6 stages
- `/tasks` — task table with priority/status management
- `/warehouse` — inventory table + stock movement history

**State:** `src/store/useAppStore.ts` holds all mock entities (customers, leads, tasks, products, stock movements) and their mutating actions. Every page reads from and writes to this store directly.

**Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`).

**Adding UI components:** Use `npx shadcn@latest add <component>` — they are placed in `src/components/ui/`.

**Theme:** Dark/light mode via `next-themes`. Use CSS variables (`--primary`, `--card`, `--border`, etc.) rather than hardcoded colors. Toggle component is `src/components/theme-toggle.tsx`.

**Not yet implemented:** API routes, database schema beyond the Prisma generator, authentication middleware, WebSocket real-time features, service layer (`src/services/`), and module logic stubs (`src/modules/`).
