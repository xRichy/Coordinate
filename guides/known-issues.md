# Coordinate — Known Issues

Bug e problemi noti scoperti durante i task ma fuori scope. Valutare a fine fase se diventano task dedicati.

---

- [ ] [Discovered during T1.2] `packages/ui`, `packages/core`, `packages/api` non hanno un `tsconfig.json` proprio, quindi `pnpm typecheck` globale fallisce su `@coordinate/ui` perché include file di VS Code/Cursor dall'`Application Support`. Fix: aggiungere `tsconfig.json` con `include: ["src/**/*"]` a ciascun package. Il problema è pre-esistente su `develop` prima di T1.2.
