# Coordinate — Known Issues

Bug e problemi noti scoperti durante i task ma fuori scope. Valutare a fine fase se diventano task dedicati.

---

- [x] [RISOLTO 2026-06-22, `chore/fix-known-issues`] [Discovered during T1.2] `pnpm typecheck` globale falliva su più package. Fix: `@types/node` aggiunto a core/api/database **e hoistato al root** (`.npmrc public-hoist-pattern[]=@types/node`) così i moduli che ricompilano i sorgenti core/database via path-alias risolvono `process`/`node:*`; creato `packages/ui/tsconfig.json`; rimosso lo script `typecheck` da `@coordinate/config` (package solo-config, niente sorgenti TS, causava OOM). **Risultato: `pnpm typecheck` 14/14 verde.**
- [ ] [Discovered during T1.3] Il Mac ha PostgreSQL locale in ascolto su `localhost:5432`, che interferisce con il mapping Docker. Soluzione applicata: porta host Docker cambiata a `5433` (interno sempre `5432`). Il `DATABASE_URL` usa `localhost:5433`. Da documentare nel README per nuovi sviluppatori.
- [ ] [Discovered during T1.5] Il middleware Next.js gira su Edge runtime e non può usare Prisma direttamente. Il `x-tenant-slug` viene impostato in middleware (Edge-safe), ma la risoluzione `slug → tenant.id` avviene in server components (Prisma in Node.js). Per Vercel Edge production, considerare `@neondatabase/serverless` o un KV cache per esporre `x-tenant-id` già in middleware.
- [x] [RISOLTO 2026-06-22] [Discovered during T1.5] `apps/web/src/hooks/use-mobile.ts` (setState dentro effect) → riscritto con `useSyncExternalStore` (niente setState-in-effect, SSR-safe).
- [x] [RISOLTO 2026-06-22] [Discovered during T1.13] `Math.random()` in render: già rimosso dalla migrazione Zustand→tRPC (nessun residuo). Inoltre fixato un `Date.now()` in render in `crm/customers/page.tsx` (estratto in helper a livello modulo).
- [x] [RISOLTO 2026-06-22] [Discovered during T1.1] `apps/web/src/store/useAppStore.ts` empty interface → `type AppState = Record<string, never>`.
- [ ] [2026-06-22, `chore/fix-known-issues`] **ESLint solo su `apps/web`**: gli altri package (core/database/api/ui/modules) avevano uno script `lint: eslint .` mai funzionante (né eslint né config) → rimosso per avere `pnpm lint` verde (1/1 = web). **Follow-up**: configurare ESLint flat condiviso per lintare anche packages/modules.
- [x] [Discovered during single-domain redesign 2026-05-30] `tenantProcedure` (`packages/api/src/trpc.ts`) risolve il tenant dallo slug ma **non verifica che l'utente sia membro** di quel tenant. La RLS protegge per `tenantId`, ma senza il controllo membership un utente autenticato può puntare a uno slug altrui (rischio più evidente col tenant nel path, dove l'URL è banalmente manipolabile). **Schedulato come fix** in `single-domain-tasks.md` → T1.4.
