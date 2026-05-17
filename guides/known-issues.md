# Coordinate — Known Issues

Bug e problemi noti scoperti durante i task ma fuori scope. Valutare a fine fase se diventano task dedicati.

---

- [ ] [Discovered during T1.2] `packages/ui`, `packages/core`, `packages/api` non hanno un `tsconfig.json` proprio, quindi `pnpm typecheck` globale fallisce su `@coordinate/ui` perché include file di VS Code/Cursor dall'`Application Support`. Fix: aggiungere `tsconfig.json` con `include: ["src/**/*"]` a ciascun package. Il problema è pre-esistente su `develop` prima di T1.2.
- [ ] [Discovered during T1.3] Il Mac ha PostgreSQL locale in ascolto su `localhost:5432`, che interferisce con il mapping Docker. Soluzione applicata: porta host Docker cambiata a `5433` (interno sempre `5432`). Il `DATABASE_URL` usa `localhost:5433`. Da documentare nel README per nuovi sviluppatori.
- [ ] [Discovered during T1.5] Il middleware Next.js gira su Edge runtime e non può usare Prisma direttamente. Il `x-tenant-slug` viene impostato in middleware (Edge-safe), ma la risoluzione `slug → tenant.id` avviene in server components (Prisma in Node.js). Per Vercel Edge production, considerare `@neondatabase/serverless` o un KV cache per esporre `x-tenant-id` già in middleware.
- [ ] [Discovered during T1.5] I lint errors pre-esistenti in `apps/web/src/hooks/use-mobile.ts` (4 errori ESLint, pattern `setState` dentro `useEffect`) bloccano `pnpm lint` globale. Da fixare in un task chore dedicato.
