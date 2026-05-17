# Coordinate — Implementation Tasks

Task plan operativo per costruire l'MVP. Ogni task è **autonomo e di dimensione "una sessione Claude Code focalizzata"** (tipicamente 30 min – 3 ore di lavoro). I task vanno eseguiti **uno alla volta, in ordine**, salvo dove esplicitamente dichiarato che sono paralleli.

## Come usare questo file

Modello git: **GitFlow semplificato** — `main` (stabile) ← `develop` (integrazione) ← `feature|fix|chore|docs/T<x.y>-<slug>` (task branches).

1. Aprire una sessione Claude Code (in questa cartella) e dire: *"Esegui il task T0.1 da `guides/implementation-tasks.md`"*.
2. Claude legge il task **e legge `guides/task-workflow.md`** per le regole git.
3. Claude parte da `develop` aggiornato, crea il branch `feature/T<x.y>-<slug>`, esegue il task, verifica gli acceptance criteria, aggiorna lo stato del task in questo file, e **pusha il branch**.
4. Claude **si ferma e consegna**: non mergi su `develop`, non mergi su `main`, mai.
5. **Tu fai la review** del branch e — se ok — mergi sul branch `develop` con `--no-ff`.
6. A fine fase, **tu** fai review complessiva di `develop` e mergi su `main` con tag `v0.X.0`.

> ⚠️ **Lettura obbligatoria prima di eseguire qualunque task**: [task-workflow.md](task-workflow.md). Definisce naming dei branch, convenzioni commit, checklist pre-consegna, regole di merge (chi fa cosa), e cosa Claude può e non può fare.

## Convenzioni dei task

- **ID**: `T<fase>.<numero>` (es. `T1.5` = Fase 1, task 5)
- **Stato**: nessuno (da fare), ✅ (fatto), ⏭ DEFERRED (rimandato post-MVP), ❌ REMOVED (eliminato dal piano)
- **Deps**: prerequisiti — altri task che devono essere `✅` prima di iniziare questo
- **Size**: `XS` (< 30min), `S` (30min-1h), `M` (1-3h), `L` (3-6h), `XL` (6h+, considerare di spezzare)
- **Files**: file principali da creare/modificare (non esaustivo, ma indicativo)
- **Done when**: criteri di completamento verificabili
- **Notes**: opzionale, gotcha, riferimenti

## Documenti di riferimento

Ogni task assume che Claude Code legga (o ricordi) questi documenti quando rilevante:
- `guides/architecture.md` — scelte architetturali, struttura monorepo, sistema moduli
- `guides/mvp-scope.md` — cosa è IN e OUT del MVP (boutique platform, ~5 clienti)
- `guides/modules-catalog.md` — definizione dei moduli e loro dipendenze
- `guides/pricing.md` — modello commerciale (canone annuale + setup fee per moduli custom)

## Stato globale

```
Fase 0  Monorepo Setup                 [✅] 8/8 task
Fase 1  Backend & Auth & Multi-Tenant  [✅] 17/18 task (T1.16 deferred → post-MVP)
Fase 2  Module Registry                [ ] 2/10 task (2 deferred)
Fase 3  Moduli MVP Core                [ ] 0/16 task (7 deferred, 1 removed)
Fase 4  Tenant Admin & Modules Config  [ ] 0/7 task (8 deferred, 1 removed)
Fase 5  Polish: theming, audit, UX     [ ] 0/6 task (2 deferred, 2 removed)
Fase 6  Testing & Hardening            [ ] 0/9 task
Fase 7  Launch Prep                    [ ] 0/4 task (3 deferred, 1 removed)
                                       --------------
                                       TOT 77 active task
                                       + 22 deferred/removed (vedi marker ⏭/❌)
```

> **Strategic refresh (2026-05)**: il piano è stato ridotto da 105 a ~77 task attivi dopo l'allineamento sul modello **boutique platform** (~5 clienti, vendita white-glove, canone annuale + setup fee per moduli custom). Le task ⏭ DEFERRED non sono perse: si attiveranno se/quando un cliente le richiede e le paga. Le task ❌ REMOVED sono fuori dall'architettura prevista.

---

# Fase 0 — Monorepo Setup

**Obiettivo**: trasformare il repo attuale in monorepo Turborepo + pnpm. Tutto deve continuare a funzionare identico — solo riorganizzato.

**Durata stimata**: 1 settimana | **Branch consigliato**: `feat/monorepo-setup`

---

### T0.1 ✅ — Install pnpm e creare branch dedicato

**Deps**: nessuna  
**Size**: XS  
**Files**: nessuno  

Azioni:
- Verificare se `pnpm` è installato (`pnpm --version`). Se non c'è, installarlo con `npm install -g pnpm` (richiede sudo? usare `corepack enable && corepack prepare pnpm@latest --activate`).
- Creare branch `git checkout -b feat/monorepo-setup`.
- Verificare che `git status` sia clean prima di iniziare i task successivi (commit eventuali pending change su altro branch).

**Done when**:
- `pnpm --version` ritorna ≥ 8.0.0
- Branch corrente è `feat/monorepo-setup`
- Working dir pulita

---

### T0.2 ✅ — Creare struttura directory del monorepo

**Deps**: T0.1  
**Size**: XS  
**Files**: `apps/`, `packages/`, `tenants/` (directory)  

Creare le directory vuote per il monorepo (con `.gitkeep` dentro le vuote per fare commit):

```
mkdir -p apps packages/ui packages/core packages/database packages/api packages/config tenants
touch apps/.gitkeep packages/ui/.gitkeep packages/core/.gitkeep packages/database/.gitkeep packages/api/.gitkeep packages/config/.gitkeep tenants/.gitkeep
```

**Done when**:
- Esistono le 7 cartelle (`apps`, `packages/ui`, `packages/core`, `packages/database`, `packages/api`, `packages/config`, `tenants`)
- `git status` mostra le cartelle (via `.gitkeep`)

> **Nota retro-strategia**: la cartella `tenants/` è stata creata in T0.2 ma con il refresh strategico (vedi `architecture.md` §6) **non viene più usata**. I moduli custom per cliente vivono in `packages/modules/<client>-<feature>/` come gli altri moduli. La cartella può essere rimossa quando si fa cleanup, ma non blocca nulla.

---

### T0.3 ✅ — Spostare il codice esistente in `apps/web`

**Deps**: T0.2  
**Size**: S  
**Files**: tutti gli artefatti del Next.js attuale  

Usare `git mv` per preservare la storia. Spostare in `apps/web/`:
- `src/`, `public/`, `prisma/`
- `package.json`, `package-lock.json`
- `next.config.ts`, `next-env.d.ts`
- `tsconfig.json`, `tsconfig.tsbuildinfo`
- `eslint.config.mjs`, `postcss.config.mjs`
- `components.json`, `prisma.config.ts`
- `.env` (se esiste — NON va su git, vedere `.gitignore`)

**NON** spostare: `.git`, `.gitignore`, `README.md`, `CLAUDE.md`, `guides/`, `coordinate.md`, `node_modules`, `.next` (rigenerati), `tsconfig.tsbuildinfo` (rigenerato).

Eliminare `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` dalla root (saranno ricreati da pnpm).

**Done when**:
- `apps/web/package.json` esiste e contiene le dipendenze attuali
- `apps/web/src/app/` contiene il codice esistente
- La root non contiene più file/cartelle Next.js (solo cartelle monorepo + docs)

---

### T0.4 ✅ — Creare configurazione workspace pnpm + Turborepo

**Deps**: T0.3  
**Size**: M  
**Files**: `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`  

Creare nella root del repo:

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/modules/*"
```

**`package.json`** (root, sostituisce il vecchio):
```json
{
  "name": "coordinate",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=8"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

Aggiornare `apps/web/package.json`:
- Cambiare `name` in `"@coordinate/web"`
- Aggiungere script `"typecheck": "tsc --noEmit"` e `"clean": "rm -rf .next node_modules .turbo"`

**Done when**:
- `pnpm-workspace.yaml`, `turbo.json`, root `package.json` esistono
- `apps/web/package.json` ha `name: "@coordinate/web"`

---

### T0.5 ✅ — Creare scaffold dei packages condivisi

**Deps**: T0.4  
**Size**: M  
**Files**: `packages/*/package.json`, `packages/*/tsconfig.json`  

Per ciascuno di `ui`, `core`, `database`, `api`, `config`, creare `package.json` minimale:

**`packages/ui/package.json`**:
```json
{
  "name": "@coordinate/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf node_modules .turbo"
  }
}
```

Replicare il pattern (cambiando solo `name`) per `core`, `database`, `api`, `config`.

Creare `packages/ui/src/index.ts` vuoto (`// placeholder`).

Creare `packages/config/tsconfig/base.json` con la config TS condivisa (target ES2022, moduleResolution bundler, strict, paths `@coordinate/*`).

**Done when**:
- Ogni package ha `package.json` + `src/index.ts` (o equivalente) placeholder
- Esiste `packages/config/tsconfig/base.json`

---

### T0.6 ✅ — Aggiornare path aliases e tsconfig di apps/web

**Deps**: T0.5  
**Size**: S  
**Files**: `apps/web/tsconfig.json`  

Aggiornare `apps/web/tsconfig.json`:
- Estendere da `../../packages/config/tsconfig/base.json` (o duplicare la config se preferito)
- Mantenere paths `@/*` → `./src/*` per il codice interno
- Aggiungere paths `@coordinate/ui` → `../../packages/ui/src`, etc.

**Done when**:
- `apps/web/tsconfig.json` valido
- Import da `@coordinate/ui` risolto (anche se il package è vuoto)

---

### T0.7 ✅ — Install dipendenze e verificare che il dev server parta

**Deps**: T0.6  
**Size**: S  
**Files**: `pnpm-lock.yaml`  

Eseguire da root:
- `pnpm install` (creerà `pnpm-lock.yaml`, eliminerà i vecchi `package-lock.json` se presenti)
- `pnpm dev` — il dev server di `apps/web` deve partire

Aprire il browser su `http://localhost:3000` e verificare che:
- L'app carica senza errori
- Il login funziona (mock)
- Le pagine dashboard / crm / warehouse / tasks sono raggiungibili

Se ci sono import path che si sono rotti durante il move, fixarli ora.

**Done when**:
- `pnpm install` completa senza errori
- `pnpm dev` avvia con successo
- Tutte le pagine principali caricano

---

### T0.8 ✅ — Commit Phase 0 + aggiornare CLAUDE.md

**Deps**: T0.7  
**Size**: XS  
**Files**: `CLAUDE.md`, commit  

- Aggiornare `CLAUDE.md` per riflettere la nuova struttura: comandi `pnpm dev` invece di `npm run dev`, posizione del codice in `apps/web/`, esistenza dei packages.
- Commit di tutto come singolo commit "feat(monorepo): convert to pnpm + turborepo workspace structure".
- Push del branch.

**Done when**:
- `CLAUDE.md` riflette il nuovo layout
- Commit creato e push fatto
- Marcare Fase 0 come ✅ nel state globale di questo documento

---

# Fase 1 — Backend, Auth e Multi-Tenancy

**Obiettivo**: passare da Zustand mock al DB reale, autenticazione, identificazione tenant via sottodominio, RLS Postgres, tRPC. Alla fine il login è reale e le query sono isolate per tenant.

**Durata stimata**: 3-4 settimane | **Branch consigliato**: `feat/backend-foundation`

---

### T1.1 ✅ — Setup Postgres locale via Docker e configurare DATABASE_URL

**Deps**: T0.8  
**Size**: S  
**Files**: `docker-compose.yml`, `apps/web/.env`, `packages/database/.env.example`  

- Creare `docker-compose.yml` alla root con servizio `postgres:16` (user/password/db: `coordinate`).
- Avviare il DB con `docker compose up -d`.
- Creare `packages/database/.env.example` con le variabili documentate (DATABASE_URL, DIRECT_URL).
- Creare `apps/web/.env` (NON committato) con le stringhe di connessione locali.
- `.gitignore`: aggiunta negazione `!**/.env.example` per permettere commit dei template.

**Note**: in produzione si userà un provider Postgres managed (es. Neon, Supabase, Railway). Le variabili in `.env.example` sono pronte per essere adattate — basta sostituire l'URL.

**Done when**:
- `docker compose up -d` avvia il container
- DB raggiungibile (`SELECT 1` risponde)
- `.env` configurato

---

### T1.2 ✅ — Spostare Prisma in packages/database e setup base

**Deps**: T1.1  
**Size**: M  
**Files**: `packages/database/prisma/schema.prisma`, `packages/database/src/client.ts`, `packages/database/package.json`  

- Spostare `apps/web/prisma/` → `packages/database/prisma/`.
- Installare `@prisma/client` + `prisma` come deps di `packages/database`.
- Aggiornare `schema.prisma`: `generator client { provider = "prisma-client-js", output = "../node_modules/.prisma/client" }`.
- Creare `packages/database/src/client.ts` che esporta `prisma` (singleton con global per dev hot reload).
- Esportare anche `prisma` da `packages/database/src/index.ts`.
- Aggiungere script `db:generate`, `db:push`, `db:migrate` in `packages/database/package.json`.

**Done when**:
- `pnpm -F @coordinate/database db:generate` funziona
- `import { prisma } from '@coordinate/database'` risolto

---

### T1.3 ✅ — Definire schema Prisma base multi-tenant + seed demo

**Deps**: T1.2  
**Size**: M  
**Files**: `packages/database/prisma/schema.prisma`, prima migration, `packages/database/prisma/seed.ts`  

Modelli da definire (con `tenantId` dove rilevante):
- `Tenant` (id, slug, name, plan, status, createdAt)
- `User` (Better-Auth gestirà questo, ma serve già lo scheletro)
- `Membership` (userId, tenantId, role) — multi-org
- `TenantSetting` (tenantId, key, value JSON)
- `AuditLog` (id, tenantId, userId, action, entityType, entityId, diff JSON, timestamp)

**NB**: non aggiungere ancora i modelli dei moduli (Contact, Lead, Product…) — quelli vanno definiti nei rispettivi moduli (Fase 2-3).

Eseguire `pnpm -F @coordinate/database db:migrate` per creare la prima migration.

**Seed demo** — creare `packages/database/prisma/seed.ts` che popola il DB con:
- 1 tenant demo (`slug: "demo"`, plan: Pro)
- 1 utente owner (email: `demo@coordinate.app`, password: `demo1234`)
- Dati campione per ogni modulo: ~5 contatti, ~5 lead su stadi diversi, ~5 task, ~5 prodotti con movimenti stock
- Aggiungere script `"db:seed": "tsx prisma/seed.ts"` in `packages/database/package.json`
- Eseguire `pnpm -F @coordinate/database db:seed`

Il seed sarà usato come fixture di riferimento per i task successivi (T1.14, T2.x).

**Done when**:
- Schema commit-able
- Migration applicata sul DB Docker locale
- `prisma studio` mostra le tabelle e i dati seed
- `docker compose up -d && pnpm -F @coordinate/database db:seed` funziona da zero

---

### T1.4 ✅ — Setup Better-Auth in packages/core/auth

**Deps**: T1.3  
**Size**: L  
**Files**: `packages/core/auth/`, `apps/web/src/server/auth.ts`  

- Installare `better-auth` in `packages/core`.
- Configurare Better-Auth con:
  - Email + password provider (con email verification)
  - OAuth: Google, Microsoft
  - Plugin `organizations` (sono i nostri tenant)
  - 2FA TOTP (opzionale per utente)
- Esportare `auth` instance da `@coordinate/core/auth`.
- Aggiungere modelli Better-Auth nello schema Prisma (Session, Account, Verification, ecc.) — vedere docs Better-Auth.
- Creare route handler in `apps/web/src/app/api/auth/[...all]/route.ts` che usa `auth.handler`.

**Done when**:
- Endpoint `/api/auth/sign-up/email` funziona via curl
- Tabelle Better-Auth in DB

---

### T1.5 ✅ — Middleware identificazione tenant via sottodominio

**Deps**: T1.3  
**Size**: M  
**Files**: `apps/web/src/middleware.ts`, `packages/core/tenant/resolve.ts`  

- Creare middleware Next.js che estrae il sottodominio da `request.headers.host`.
- Risolvere lo slug → `Tenant` via Prisma.
- Settare l'ID tenant in un header (es. `x-tenant-id`) accessibile lato server.
- In dev, gestire `*.lvh.me:3000` come dominio multi-tenant.
- Path speciali (no sottodominio richiesto): `/`, `/signup`, `/login`, `/api/auth/*`, `/_next/*`.
- Su `coordinate.app` (no sottodominio) → redirect a landing/marketing.

**Done when**:
- `acme.lvh.me:3000` mostra l'app, con `x-tenant-id` settato
- `coordinate.app` mostra la landing (anche solo un placeholder per ora)

---

### T1.6 ✅ — Abilitare Postgres Row-Level Security

**Deps**: T1.5  
**Size**: L  
**Files**: nuova migration SQL, `packages/database/src/with-tenant.ts`  

- Creare migration SQL che abilita RLS su tutte le tabelle con `tenantId`.
- Per ogni tabella, policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- Creare helper `withTenant(tenantId, callback)` in `packages/database/src/with-tenant.ts` che:
  - Acquisisce una connessione dedicata
  - Esegue `SET LOCAL app.tenant_id = '<tenantId>'`
  - Esegue la callback
  - Rilascia la connessione

**Done when**:
- RLS attivo su tabelle multi-tenant
- Test manuale: senza `SET LOCAL`, le query ritornano vuoto
- Helper `withTenant` funziona

---

### T1.7 ✅ — Test isolamento tenant (RLS) automatizzato

**Deps**: T1.6  
**Size**: M  
**Files**: `packages/database/test/rls.test.ts`  

- Installare vitest in `packages/database`.
- Scrivere test che:
  1. Crea due tenant T_A e T_B
  2. Crea un AuditLog su T_A
  3. Setta tenant context su T_B e prova a leggere → deve essere vuoto
  4. Setta su T_A → vede il log

**Done when**:
- `pnpm -F @coordinate/database test` passa

---

### T1.8 ✅ — Setup tRPC base + integrazione con Next.js App Router

**Deps**: T1.4, T1.5  
**Size**: L  
**Files**: `packages/api/src/trpc.ts`, `packages/api/src/root.ts`, `apps/web/src/app/api/trpc/[trpc]/route.ts`  

- Installare `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query` in `packages/api` e `apps/web`.
- Creare `packages/api/src/trpc.ts` che esporta `t`, `router`, `publicProcedure`, `protectedProcedure`, `tenantProcedure`.
  - `protectedProcedure`: richiede sessione Better-Auth valida
  - `tenantProcedure`: estende protected, richiede tenantId, wrappa con `withTenant`
- Creare `packages/api/src/root.ts` con `appRouter` (per ora vuoto).
- Creare route handler `apps/web/src/app/api/trpc/[trpc]/route.ts`.

**Done when**:
- `appRouter` esportato e tipato
- Endpoint `/api/trpc/healthcheck` (test procedure pubblica) risponde 200

---

### T1.9 ✅ — Client tRPC nel frontend + TanStack Query provider

**Deps**: T1.8  
**Size**: M  
**Files**: `apps/web/src/lib/trpc-client.ts`, `apps/web/src/app/layout.tsx`  

- Creare client tRPC + React Query provider.
- Wrappare l'app in `<TRPCProvider>` nel layout root (sotto SessionProvider/ThemeProvider).
- Esempio di chiamata: `trpc.healthcheck.useQuery()` in una pagina di test.

**Done when**:
- Componente client può chiamare procedure tRPC e ricevere risposta

---

### T1.10 ✅ — Pagina di sign-up (email/password)

**Deps**: T1.4, T1.9  
**Size**: M  
**Files**: `apps/web/src/app/(auth)/signup/page.tsx`, `apps/web/src/app/(auth)/layout.tsx`  

- Form sign-up: email, password, nome, cognome, nome azienda.
- Validazione Zod.
- Submit → chiama Better-Auth sign-up + crea Tenant + crea Membership owner.
- Redirect immediato a `<slug>.lvh.me:3000/dashboard` dopo signup (nessuna verifica email per ora — vedi nota T1.16).

> **Nota retro-strategia**: con il refresh boutique, la pagina di signup pubblica non è più necessaria al lancio (i tenant si creano via comando admin — vedi T4.7 nuovo). Resta utile come strumento di dev e può essere disabilitata in produzione tramite env var, ma non si rimuove dal codice.

**Done when**:
- Sign-up flow end-to-end funziona
- Nuovo tenant creato in DB con owner

---

### T1.11 ✅ — Pagina di login + flusso OAuth Google/Microsoft

**Deps**: T1.4, T1.9  
**Size**: M  
**Files**: `apps/web/src/app/(auth)/login/page.tsx`  

- Form login email+password.
- Bottoni "Continua con Google", "Continua con Microsoft".
- Redirect post-login → `<tenant-slug>.lvh.me:3000/dashboard`.
- Se utente appartiene a più tenant, mostra step di scelta tenant.

**Done when**:
- Login funziona, redirect a sottodominio tenant ok
- OAuth Google + Microsoft testati in dev

---

### T1.12 ✅ — Logout + gestione sessioni multi-tab

**Deps**: T1.11  
**Size**: S  
**Files**: `apps/web/src/components/layout/AppHeader.tsx`, hook `useSession`  

- Pulsante logout in header / user menu.
- Su logout, invalidate sessione Better-Auth, redirect a `coordinate.app/login`.
- Verifica multi-tab: logout in tab A → tab B perde sessione al refresh.

**Done when**:
- Logout funziona, redirect corretto

---

### T1.13 ✅ — RBAC: ruoli predefiniti + middleware tRPC `requirePermission`

**Deps**: T1.8  
**Size**: M  
**Files**: `packages/core/permissions/`, `packages/api/src/middleware/permission.ts`  

- Definire 4 ruoli enum: `owner`, `admin`, `member`, `viewer`.
- Definire matrice permessi → ruoli (es. `tenant:settings:write` → owner, admin).
- Creare middleware tRPC `requirePermission('xxx')` che valida sul `Membership` dell'utente nel tenant corrente.
- Creare hook React `useCan('permission')` per UI gating.

**Done when**:
- Procedure protette possono dichiarare permessi
- Hook `useCan` testato in una pagina

---

### T1.14 ✅ — TanStack Query come sostituto di Zustand per dati server

**Deps**: T1.9  
**Size**: L  
**Files**: `apps/web/src/store/useAppStore.ts` (parziale), e tutti i punti che usano Zustand per dati  

- Identificare TUTTI gli usi di Zustand per **dati server** (contatti, lead, prodotti, task, movimenti).
- Per ciascuno, sostituire con `trpc.<modulo>.<query>.useQuery()`.
- Lasciare in Zustand solo lo **UI state** (es. sidebar aperta, filtri locali).
- Le procedure tRPC corrispondenti NON esistono ancora — creare stub che ritornano array vuoti, da implementare nei task delle Fasi 2-3 quando i moduli sono estratti.

**Done when**:
- Zustand contiene solo UI state
- Pagine principali fanno chiamate tRPC (anche se ritornano vuoto per ora)

---

### ✅ T1.15 — Setup Inngest per background jobs

**Deps**: T1.8  
**Size**: M  
**Files**: `packages/core/src/jobs/`, `apps/web/src/app/api/inngest/route.ts`  

- Installare `inngest` e `inngest-cli` (dev).
- Configurare client Inngest in `packages/core/src/jobs/client.ts`.
- Creare endpoint Next.js per Inngest webhook in `apps/web/src/app/api/inngest/route.ts`.
- Creare job di test `hello-world` in `packages/core/src/jobs/hello-world.ts`.
- Dev: `npx inngest-cli@latest dev` parallelamente al `pnpm dev`, poi aprire http://localhost:8288.

**Done when**:
- Job di test triggerato manualmente da Inngest dashboard si esegue

---

### T1.16 ⏭ DEFERRED — Setup Resend per email transazionali

**Deps**: T1.4  
**Size**: M  
**Files**: `packages/core/email/`, `apps/web/src/server/email/`  

> **Decisione**: con il modello boutique, le email transazionali (welcome, payment, trial) non servono nell'MVP — il primo cliente viene onboarded via comando admin (T4.7) e riceve credenziali via canale concordato. Resend si introdurrà solo se serve invio email da dentro l'app (es. preventivi al cliente finale, inviti utente con link styled).

- Installare `resend` + `@react-email/components`.
- Creare API key Resend.
- Creare template React Email: `InviteEmail` (e altri se servono).
- Helper `sendEmail({ to, template, props })` in `packages/core/email`.

**Done when (se attivato)**:
- Invio email reale funzionante
- Almeno un template (es. invito utente) rendered correttamente

---

### ✅ T1.17 — Setup Sentry + PostHog (observability)

**Deps**: T1.8  
**Size**: M  
**Files**: `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`, `packages/core/src/analytics/posthog.ts`, `apps/web/src/components/posthog-provider.tsx`  

- Installare Sentry per Next.js (`@sentry/nextjs`) + configurare DSN.
- Installare PostHog client (`posthog-js`) nel web e server (`posthog-node`) in core.
- Events PostHog: `signup_completed` (databaseHooks.user.create.after), `tenant_created` (onboarding router), `login` (databaseHooks.session.create.after).
- Entrambe le integrazioni sono no-op se le env var non sono configurate (sicuro in dev locale).
- Per attivare: configurare `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_API_KEY` in `.env.local` (vedi commenti nel file).

**Done when**:
- Errore lanciato di test appare in Sentry *(richiede DSN reale)*
- Evento di test appare in PostHog *(richiede API key reale)*

---

### ✅ T1.18 — Commit Phase 1 + smoke test end-to-end

**Deps**: tutti i T1.* eccetto T1.16 (deferred)  
**Size**: S  

- Smoke test (da eseguire manualmente): `pnpm dev` → signup su `lvh.me:3000/signup` → redirect a `<slug>.lvh.me:3000/dashboard` → logout → redirect a login.
- Typecheck ✅ su tutti i package Fase 1: `@coordinate/core`, `@coordinate/api`, `@coordinate/database`, `@coordinate/web`.
- Marcare Fase 1 come ✅

---

# Fase 2 — Module Registry

**Obiettivo**: implementare il sistema di moduli con manifest, e migrare i moduli MVP (CRM contacts/leads, warehouse, activities, dashboard) al nuovo pattern.

**Durata stimata**: 2 settimane | **Branch consigliato**: `feat/module-registry`

> **Refresh strategico**: rispetto al piano originale, Fase 2 è stata semplificata. Niente cartella `tenants/` speciale (i moduli custom vivono in `packages/modules/` come gli altri), niente build-time route generation script complesso (le rotte sono file Next.js diretti che re-esportano dai moduli), niente schema merge cross-modulo (un solo `schema.prisma` con sezioni demarcate per modulo). Vedi `architecture.md` §6-7.

---

### T2.1 ✅ — Definire type ModuleManifest e contract del registry

**Deps**: T1.18  
**Size**: M  
**Files**: `packages/core/module-registry/types.ts`  

Definire i types secondo `architecture.md` §7:
- `ModuleManifest`: id, version, displayName, dependsOn, routes, navigation, permissions, prismaSchema, apiRouter, eventHandlers, customFieldsExtensions, settingsPage
- `RegisteredModule`, `ModuleRegistry`, `getNavigation(user)`, `getApiRouter(tenant)`

**Done when**:
- Type ben definito, esportato da `@coordinate/core`
- TSDoc su ogni campo del manifest

---

### T2.2 ✅ — Implementare ModuleRegistry con loader

**Deps**: T2.1  
**Size**: L  
**Files**: `packages/core/module-registry/registry.ts`, `packages/core/module-registry/loader.ts`  

- `registerModule(manifest)` per ogni manifest
- `loadModules()` enumera i `packages/modules/*` e li registra
- Validazione: nessun duplicato di id, dipendenze esistono, no cicli
- API: `getEnabledModules(tenantId)`, `getApiRouter(tenantId)`, `getNavigation(user)`

**Done when**:
- Test unitario: registrare un manifest fake, recuperare via API

---

### T2.3 — Pattern di mounting rotte: import diretto in apps/web

**Deps**: T2.2  
**Size**: S  
**Files**: `apps/web/src/app/(modules)/`  

> **Refresh strategico**: l'approccio originale (script `prebuild` che genera codice) è stato semplificato. Con ~5 clienti tutti sullo stesso deploy, il file system di Next.js può fare il lavoro: ogni modulo espone i suoi page component, e in `apps/web/src/app/(modules)/<module-id>/<path>/page.tsx` scriviamo un file di 1 riga che fa `export { default } from "@coordinate/modules-<id>/pages/<X>";`.

Lavoro effettivo del task:
- Definire la convenzione su dove vivono i page component nei moduli (`packages/modules/<id>/src/pages/`)
- Definire dove vivono i re-export in `apps/web` (`apps/web/src/app/(modules)/<id>/`)
- Documentare la convenzione in `architecture.md` (se non già fatto in §7)
- Creare un README breve in `apps/web/src/app/(modules)/` con istruzioni "come aggiungere una rotta di modulo"

**Done when**:
- Convenzione documentata
- 1 esempio funzionante (anche fake placeholder) di rotta `(modules)/<id>/<x>/page.tsx` che importa da `@coordinate/modules-<id>`

---

### T2.4 ⏭ DEFERRED — Sistema di merge dello schema Prisma multi-modulo

> **Decisione**: con il modello boutique (un singolo schema gestito da te), è più semplice avere **un solo `packages/database/prisma/schema.prisma`** con sezioni demarcate da commenti (`// ── crm-contacts ──`, `// ── warehouse ──`). Quando un cliente paga un modulo custom, aggiungi i suoi modelli nello stesso file con un comment marker del cliente. Niente build pipeline di merge.
>
> Si attiva: se il numero di moduli rende il file ingestibile (>2000 righe), o se serve davvero che ogni modulo gestisca le sue migration in autonomia.

---

### T2.5 — Creare packages/modules/crm-contacts (scaffold)

**Deps**: T2.3  
**Size**: M  
**Files**: `packages/modules/crm-contacts/`  

- `package.json`, `tsconfig.json`, `src/manifest.ts`, `src/router.ts`, `src/pages/`
- Manifest minimale che dichiara: 1 rotta (`/crm/customers`), 1 voce nav, permessi `crm:contact:read|write|delete`
- I modelli Prisma del modulo vanno aggiunti direttamente in `packages/database/prisma/schema.prisma` sotto un comment marker `// ── crm-contacts ──` (vedi T2.6)

**Done when**:
- Modulo riconosciuto dal registry
- Rotta `/crm/customers` raggiungibile (placeholder vuoto)

---

### T2.6 — Migrare modello Contact al modulo crm-contacts

**Deps**: T2.5  
**Size**: M  
**Files**: `packages/database/prisma/schema.prisma`, migration  

- Definire Contact (persona+azienda in un modello con discriminator `type`) nello schema Prisma centrale, sotto comment marker `// ── crm-contacts ──`
- Includere `tenantId`, indici, RLS via migration

**Done when**:
- Modello Contact in DB con RLS
- Prisma client tipizza Contact

---

### T2.7 — Migrare logica Customers dalla pagina esistente al modulo

**Deps**: T2.6  
**Size**: L  
**Files**: `packages/modules/crm-contacts/src/router.ts`, `src/pages/CustomersPage.tsx`  

- Spostare il componente `apps/web/src/app/crm/customers/page.tsx` in `packages/modules/crm-contacts/src/pages/CustomersPage.tsx`
- Sostituire useAppStore con `trpc.crm.contact.list.useQuery()`
- Procedure tRPC: `crm.contact.list`, `crm.contact.create`, `crm.contact.update`, `crm.contact.delete`
- Modal aggiungi/modifica preservata, integrata con tRPC mutation

**Done when**:
- Pagina Customers funziona con DB reale
- CRUD su Contact funzionante

---

### T2.8 — Migrare Leads in crm-pipeline (nuovo modulo)

**Deps**: T2.5, T2.6  
**Size**: L  
**Files**: `packages/modules/crm-pipeline/`  

- Creare modulo crm-pipeline (depends on crm-contacts)
- Modelli: Lead, Deal, PipelineStage (aggiunti in `schema.prisma` sotto marker `// ── crm-pipeline ──`)
- Migrazione della Kanban board da `apps/web/src/app/crm/leads/page.tsx`

**Done when**:
- Pagina /crm/leads funzionante con DB reale
- Drag&drop persiste su DB

---

### T2.9 — Migrare Tasks in modulo activities

**Deps**: T2.5  
**Size**: M  
**Files**: `packages/modules/activities/`  

- Creare modulo activities con modello Activity (type: task|call|meeting|note)
- Migrare `apps/web/src/app/tasks/page.tsx`
- Procedure tRPC

> **Cambio**: il piano originale citava "custom fields wrapper". Rimosso — niente custom fields dinamici nell'MVP (vedi `architecture.md` §8). Se un cliente vuole un campo aggiuntivo, lo si aggiunge in codice.

**Done when**:
- Pagina /tasks funzionante con DB reale

---

### T2.10 — Migrare Warehouse in modulo warehouse

**Deps**: T2.5  
**Size**: L  
**Files**: `packages/modules/warehouse/`  

- Creare modulo warehouse con modelli Product, StockMovement
- Migrare `apps/web/src/app/warehouse/page.tsx` (inventory + movement history tabs)

**Done when**:
- Pagina /warehouse funzionante con DB reale

---

### T2.11 ⏭ DEFERRED — Sistema di event bus interno

> **Decisione**: niente event bus implementato nell'MVP. I moduli che esistono al lancio (`crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard`) non hanno bisogno di comunicare tra loro in modo asincrono. Si attiva quando emerge il primo caso d'uso reale (es. "quando un Deal va in Won, crea una Activity di follow-up"). Vedi `architecture.md` §9.
>
> Il manifest mantiene il campo `eventHandlers` (definito in T2.1) per quando l'event bus arriverà.

---

### T2.12 — Commit Phase 2 + verifica navigazione dinamica

**Deps**: tutti i T2.* attivi  
**Size**: S  

- Verificare che la sidebar mostri voci nav generate dai manifest (non hardcoded)
- Smoke test su tutte le pagine migrate
- Commit + merge
- Marcare Fase 2 come ✅

---

# Fase 3 — Costruzione dei moduli core MVP

**Obiettivo**: portare i 5 moduli core MVP (`crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard`) a livello "consegnabile al primo cliente".

**Durata stimata**: 2-3 settimane | **Branch consigliato**: `feat/mvp-modules`

> **Refresh strategico**: i moduli `calendar`, `quotes`, `it-anagrafica-check` sono stati spostati a catalogo (vedi `modules-catalog.md`). Si costruiscono solo quando un cliente li paga. Idem per il sistema custom fields dinamici (rimosso).

---

### T3.1 — crm-contacts: aggiungere relazione Persona ↔ Azienda

**Deps**: T2.7  
**Size**: M  
**Files**: schema fragment + UI dettaglio contatto  

**Done when**:
- Modello con relazione padre-figlio
- UI dettaglio mostra persone associate all'azienda

---

### T3.2 — crm-contacts: tags e owner

**Deps**: T3.1  
**Size**: M  
**Files**: schema fragment + UI  

- Modello Tag (tenant-scoped) + relazione many-to-many con Contact
- UI: chip-input per tag, filtro lista per tag
- Owner: select utente del tenant

---

### T3.3 — crm-contacts: import CSV con mapping manuale

**Deps**: T3.2  
**Size**: L  
**Files**: nuova pagina importer  

- Upload CSV
- Mapping colonne → campi Contact (UI)
- Preview prime 5 righe
- Import batch con feedback progressi

---

### T3.4 — crm-contacts: export CSV

**Deps**: T3.2  
**Size**: S  

- Bottone export, scarica CSV filtrato

---

### T3.5 — crm-contacts: soft delete con ripristino entro 30gg

**Deps**: T3.2  
**Size**: M  

- Campo `deletedAt` su Contact
- Filtro default exclude deleted
- Pagina "Cestino" admin con ripristino
- Job Inngest che hard-delete dopo 30gg

---

### T3.6 — crm-pipeline: stadi configurabili dal tenant

**Deps**: T2.8  
**Size**: M  
**Files**: pagina settings pipeline  

- Modello PipelineStage (tenant-scoped, ordinato)
- UI in settings tenant per riordinare/rinominare/aggiungere stadi
- Default 6 stadi creati alla creazione del tenant (script admin T4.7)

---

### T3.7 — crm-pipeline: conversione Lead → Deal e Deal Won → Customer

**Deps**: T3.6  
**Size**: M  

- Workflow: pulsante "Convert to Deal" sulla card Lead
- Quando Deal va in stadio "Won", marca Contact come customer

---

### T3.8 — crm-pipeline: vista tabella alternativa al Kanban

**Deps**: T2.8  
**Size**: M  

- Toggle Kanban/Table
- Tabella sortable, filtrabile, con paginazione

---

### T3.9 — activities: timeline cross-modulo su contatto/deal

**Deps**: T2.9, T2.8  
**Size**: L  

- Componente Timeline (vista dettaglio contatto e dettaglio deal)
- Mostra activities + cambi stadio + eventi rilevanti (cronologico)

---

### T3.10 — activities: promemoria via notifiche in-app

**Deps**: T2.9  
**Size**: M  

- Job Inngest che ogni ora scansiona activities con `dueDate` entro X
- Crea notifica in-app (campanella) per Task in scadenza < 24h

> **Cambio rispetto al piano originale**: niente email (Resend deferred — T1.16). Solo notifiche in-app.

---

### T3.11 ⏭ DEFERRED — Modulo calendar (nuovo): vista mese + settimana

> **Decisione**: il modulo `calendar` non è incluso nei core MVP (vedi `mvp-scope.md` §4 e `modules-catalog.md` §3). Si costruisce quando un cliente lo richiede e lo paga.
>
> Quando si attiva, lo scope è quello del piano originale:
> - Modulo calendar (dep on activities)
> - Vista mese + settimana (FullCalendar o lib equivalente)
> - Eventi = activities di tipo Meeting/Call con dueDate
> - Click → drawer activity dettaglio

---

### T3.12 ⏭ DEFERRED — calendar: creazione evento dal calendario

> Dipende da T3.11 (deferred). Stesso razionale.

---

### T3.13 — Modulo dashboard MVP

**Deps**: T2.8, T2.7, T2.9  
**Size**: L  
**Files**: `packages/modules/dashboard/`  

- 6 widget fissi (vedi `mvp-scope.md` §4 M5)
- Filtri periodo + owner
- Numeri cliccabili → drill-down

---

### T3.14 — warehouse: alert stock sotto soglia

**Deps**: T2.10  
**Size**: S  

- Badge visivo su prodotti
- Banner dashboard con count prodotti sotto soglia

---

### T3.15 — warehouse: import CSV prodotti

**Deps**: T2.10  
**Size**: M  

- Analogo a T3.3 ma per Product

---

### T3.16 ⏭ DEFERRED — Modulo quotes (nuovo): modello e UI base

> **Decisione**: il modulo `quotes` non è incluso nei core MVP. Si costruisce quando un cliente lo richiede.
>
> Quando si attiva, lo scope è quello del piano originale (Quote + QuoteLine, UI lista + crea/modifica, righe con prodotto o testo libero, sconti).

---

### T3.17 ⏭ DEFERRED — quotes: generazione PDF brandato

> Dipende da T3.16 (deferred). Quando si attiva: template con react-pdf o puppeteer, brand cliente (logo + colore), numerazione configurabile.

---

### T3.18 ⏭ DEFERRED — quotes: invio via email + tracking stato

> Dipende da T3.16 + T1.16 (entrambi deferred). Quando si attiva: email con PDF allegato, stato preventivo (bozza → inviato → accettato/rifiutato), storico email.

---

### T3.19 ⏭ DEFERRED — Modulo it-anagrafica-check (nuovo): validazione P.IVA/CF

> **Decisione**: anche se è un "quick win" italiano (Size: M), non è incluso nei core MVP. Si costruisce quando il primo cliente lo richiede — probabilmente il primo modulo dal catalogo a essere costruito post-MVP.
>
> Quando si attiva: validazione P.IVA via checksum, verifica VIES UE, validazione CF via algoritmo, endpoint tRPC `it.anagrafica.verifyPIVA`.

---

### T3.20 ⏭ DEFERRED — it-anagrafica-check: autocompletamento azienda da P.IVA

> Dipende da T3.19 (deferred).

---

### T3.21 ❌ REMOVED — Custom fields: implementazione 5 tipi base

> **Decisione**: il sistema di custom fields dinamici a runtime è **fuori dall'architettura MVP**. Con ~5 clienti, se serve un campo, si aggiunge nel codice del modulo. Vedi `architecture.md` §8 per il razionale.
>
> Si rivaluta se 2+ clienti chiedono lo stesso tipo di personalizzazione "voglio aggiungere il campo X" — a quel punto si introduce il sistema.

---

### T3.22 — Search globale (Postgres tsvector)

**Deps**: T2.7, T2.8, T2.10  
**Size**: M  

- Colonna `searchable tsvector` generata via trigger su Contact, Deal, Product
- Indice GIN
- Procedure tRPC `search.global({ query })`
- Componente header search bar con risultati raggruppati

> **Cambio rispetto al piano originale**: scope ridotto. Niente search su Quote (modulo deferred). Size declassato da L a M.

---

### T3.23 — Notifiche in-app (campanella + dropdown)

**Deps**: T1.15  
**Size**: M  

- Modello Notification (recipient, type, message, link, readAt)
- UI campanella header con badge unread
- Mark as read
- Eventi che generano notifiche: activity reminder, deal won

> **Cambio**: niente "mention" futuro, niente legame con T1.16 (Resend deferred). Solo in-app.

---

### T3.24 — Commit Phase 3 + acceptance review

**Deps**: tutti T3.* attivi  
**Size**: S  

- Tutti i 5 moduli core MVP funzionanti su DB reale
- Smoke test completo: login → contatto → lead → deal → won → activity → warehouse + movimento
- Marcare Fase 3 come ✅

---

# Fase 4 — Tenant Admin & Modules Config

**Obiettivo**: dare strumenti per gestire un tenant (dati azienda, branding, team, moduli abilitati) + creazione tenant manuale via comando admin (sostituisce il signup self-serve).

**Durata stimata**: 1-2 settimane | **Branch consigliato**: `feat/tenant-admin`

> **Refresh strategico drastico**: Fase 4 è stata ridotta da 16 a 7 task attivi. Stripe, Customer Portal, webhook, trial, onboarding wizard, knowledge base, status page sono tutti ⏭ DEFERRED o ❌ REMOVED. La fatturazione è manuale (vedi `pricing.md`), l'onboarding è white-glove via comando CLI.

---

### T4.1 ⏭ DEFERRED — Setup Stripe account + prodotti/prezzi

> **Decisione**: niente Stripe nell'MVP. Fatturazione manuale (contratto + fattura PDF + bonifico). Vedi `pricing.md`.
> Si attiva: se il modello commerciale cambia (es. arriva un cliente che vuole pagare a canone mensile con carta) — improbabile a 5 clienti.

---

### T4.2 ⏭ DEFERRED — Modello Subscription nel DB

> Dipende da T4.1 (deferred).

---

### T4.3 ⏭ DEFERRED — Stripe Checkout per nuovo abbonamento

> Dipende da T4.1, T4.2 (deferred).

---

### T4.4 ⏭ DEFERRED — Webhook Stripe handler + idempotenza

> Dipende da T4.3 (deferred).

---

### T4.5 ⏭ DEFERRED — Stripe Customer Portal per gestione abbonamento

> Dipende da T4.4 (deferred).

---

### T4.6 ❌ REMOVED — Trial 14 giorni gestito dal sistema

> **Decisione**: niente trial nell'MVP. Il cliente firma un contratto e si fattura il canone annuale. Se serve un "periodo di comfort", lo si gestisce contrattualmente, non con feature di prodotto.

---

### T4.7 — Comando admin per creare un nuovo tenant (CLI o pagina riservata)

**Deps**: T1.18  
**Size**: M  
**Files**: `apps/web/src/app/admin/` (pagina riservata) **oppure** script CLI in `packages/database/scripts/create-tenant.ts`  

> **Refresh strategico**: sostituisce il "Onboarding wizard post-signup" del piano originale. Niente wizard pubblico, niente Stripe Checkout — il tenant lo crei tu via comando.

Lavoro:
- Comando (CLI con `tsx` o pagina admin protetta da env var `ADMIN_TOKEN`) che accetta:
  - Slug del tenant (es. `acme`)
  - Nome azienda
  - Email + nome del primo utente owner
  - Lista moduli abilitati (default: i 5 core MVP)
  - Settings opzionali (colore primario, logo URL)
- Esecuzione crea:
  - Record `Tenant` con slug, settings di base
  - Record `User` con password generata (o flag "password reset al primo login")
  - Record `Membership` con role `owner`
  - `TenantConfig` con `enabledModules` (vedi T4.10)
- Output: credenziali da inviare al cliente via canale concordato (email manuale, telefono, ecc.)

**Done when**:
- Eseguendo il comando, il tenant viene creato e l'utente owner può fare login su `<slug>.coordinate.app`
- Sono attivi solo i moduli specificati al comando

---

### T4.8 — Pagina tenant admin: dati azienda e branding

**Deps**: T1.13  
**Size**: M  

- Settings: nome, P.IVA, CF, indirizzo, fuso orario
- Upload logo (R2 — vedi T4.12)
- Color picker per colore primario
- Preview live del branding

> **Cambio**: niente campo `lingua` (italiano fissato).

---

### T4.9 — Pagina tenant admin: gestione team

**Deps**: T1.13  
**Size**: M  

- Lista membri con ruolo
- Invita per email (con scelta ruolo) — l'utente invitato riceve link, completa setup password
- Modifica ruolo / rimuovi membro
- Transfer ownership

> **Nota**: l'invito via email può funzionare con un link di accept-invite anche senza Resend (T1.16 deferred). Si usa SMTP di sistema o si comunica il link via altro canale finché Resend non c'è.

---

### T4.10 — Pagina tenant admin: abilitazione moduli

**Deps**: T2.12  
**Size**: M  

- Lista moduli del catalogo (`getEnabledModules` dal registry)
- Toggle on/off per modulo (con conferma)
- Solo per ruolo `owner` o utente con permesso speciale `admin:modules:configure`
- Persiste in `TenantConfig.enabledModules`

> **Cuore della config per-cliente**. Questo è il modo in cui ogni tenant ha la sua mix di moduli attivi.

---

### T4.11 ⏭ DEFERRED — Pagina tenant admin: billing overview

> Dipende da Stripe (T4.1-T4.4 deferred). Con fatturazione manuale, il cliente non ha una "billing page" — riceve fatture PDF via email.

---

### T4.12 — Cloudflare R2 setup per file storage

**Deps**: T3.21 (deprecato — adattare a T4.8)  
**Deps reali**: T4.8  
**Size**: M  

- Account R2 + bucket
- API keys
- Helper upload signed URL in `packages/core/file-storage`
- Migration: spostare upload logo lì

---

### T4.13 ⏭ DEFERRED — Knowledge base seed + componente in-app

> **Decisione**: con 5 clienti, la KB non è prioritaria. Il supporto è 1:1 via email. Se servono "istruzioni base", si scrivono in 1 pagina markdown linkata dall'header.
> Si attiva: quando il volume di richieste di supporto rende inefficiente rispondere ogni volta.

---

### T4.14 ⏭ DEFERRED — Status page setup (statuspage.io o equivalente)

> **Decisione**: con un singolo deploy e 5 clienti, gli incident si comunicano via email/chat diretti. Una status page pubblica non serve nell'MVP. Si valuta se si arriva a >5 clienti o se un cliente lo richiede contrattualmente (SLA).

---

### T4.15 — GDPR: export dati tenant + privacy/terms pages

**Deps**: T1.18, T4.8  
**Size**: M  

- Endpoint admin "Export my data" → genera ZIP CSV di tutti i dati del tenant
- Pagine pubbliche `/privacy`, `/terms`, `/dpa` (markdown content, anche minimo per ora)
- Cookie banner per analytics (PostHog) — solo se PostHog è attivo

> **Cambio**: Size declassato da L a M. Niente compliance avanzata nell'MVP, solo il minimo legale per il primo cliente.

---

### T4.16 — Commit Phase 4 + smoke test creazione tenant end-to-end

**Deps**: tutti T4.* attivi  
**Size**: S  

- Test: usa il comando T4.7 per creare un tenant di test → il cliente fa login → vede i moduli abilitati → admin tenant può modificare branding/team/moduli → ✅
- Marcare Fase 4 come ✅

> **Cambio**: rispetto al piano originale ("comprare un piano end-to-end con Stripe"), il test è "creare un tenant e usarlo end-to-end".

---

# Fase 5 — Polish: theming, audit log, UX

**Obiettivo**: portare l'UX al livello "consegnabile al primo cliente". Theming applicato, audit log visibile, empty states e responsive curati.

**Durata stimata**: 1 settimana | **Branch consigliato**: `feat/polish`

> **Refresh strategico**: i task di i18n (T5.1, T5.2), pricing page pubblica (T5.8), landing page marketing (T5.9) sono ⏭ DEFERRED o ❌ REMOVED. Vedi `mvp-scope.md` §5.

---

### T5.1 ⏭ DEFERRED — Setup next-intl + estrazione stringhe IT default

> **Decisione**: niente i18n nell'MVP. Solo italiano hardcoded. Si attiva: se arriva un cliente non-italiano.

---

### T5.2 ⏭ DEFERRED — i18n: formato date/numeri/valute per locale

> Dipende da T5.1 (deferred). Per ora si usa `Intl.*` con locale `it-IT` hardcoded.

---

### T5.3 — Theming: applicazione colore tenant via CSS variables

**Deps**: T4.8  
**Size**: M  

- Componente `<TenantThemeProvider>` che inietta variabili nel `<html>`
- Generazione palette (shades 50-900) dal colore primario via OKLCH
- Logo tenant nella header

---

### T5.4 — Audit log: visualizzazione admin

**Deps**: T1.3  
**Size**: M  

- Pagina admin "Audit log" con filtri (utente, periodo, azione)
- Ogni entry mostra diff JSON (read-only)

---

### T5.5 — Empty states + loading skeletons in tutte le pagine

**Deps**: T3.24  
**Size**: M  

- Standardizzare empty state component
- Skeleton per ogni tabella/lista

---

### T5.6 — Mobile responsive review

**Deps**: T5.5  
**Size**: M  

- Verifica responsive 375px (iPhone SE) → desktop
- Fix tabelle che overflowano
- Menu mobile hamburger funzionante

---

### T5.7 — Branding: logo Coordinate, favicon, OG image

**Deps**: nessuna (parallelo)  
**Size**: S  

- Logo Coordinate (SVG)
- Favicon set completo (multiple sizes)
- OG image per share (anche minima)

---

### T5.8 ❌ REMOVED — Pagina `/pricing` pubblica

> **Decisione**: niente pricing pubblico (vedi `pricing.md`). Il pricing è negoziato col cliente.

---

### T5.9 ❌ REMOVED — Landing page `/` pubblica

> **Decisione**: niente landing marketing nell'MVP. Sul dominio `coordinate.app` si serve una pagina statica minimale "Cosa è Coordinate + contatto" (eventuale, anche solo un mailto:). Non serve lavoro tipo SEO + Lighthouse 90 + hero animati.
>
> Si rivaluta: se in futuro si vuole posizionamento pubblico (improbabile col modello boutique).

---

### T5.10 — Commit Phase 5 + UX review

**Deps**: tutti T5.* attivi  
**Size**: S  

- Walkthrough completo come utente nuovo del tenant
- ✅

---

# Fase 6 — Testing & Hardening

**Obiettivo**: rendere il prodotto sicuro e robusto. Test E2E, security review, performance check.

**Durata stimata**: 1-2 settimane | **Branch consigliato**: `feat/hardening`

---

### T6.1 — Setup Playwright + test E2E sul flusso login

**Deps**: T5.10  
**Size**: M  

- Setup Playwright in `apps/web`
- Test: login → dashboard del tenant → primo deal creato

> **Cambio**: il flusso testato è "login → dashboard → deal", non "signup → email verify → tenant created" (signup non è il flusso primario nel modello boutique).

---

### T6.2 — E2E: contatto + lead + deal (golden path commerciale)

**Deps**: T6.1  
**Size**: M  

- Test golden path: aggiungere contatto + lead + deal + spostarlo su Won
- Verifica che il contatto diventa "customer"

> **Cambio**: rimosso "preventivo" dal test (modulo quotes deferred).

---

### T6.3 — E2E: warehouse + movimento stock

**Deps**: T6.1  
**Size**: S  

- Test golden path magazzino: aggiungi prodotto + movimento In + verifica stock + verifica alert sotto soglia

---

### T6.4 — E2E: creazione tenant via comando admin

**Deps**: T6.1, T4.7  
**Size**: S  

> **Cambio**: il test originale (E2E it-anagrafica-check con mock VIES) è deferred col modulo. Lo sostituiamo con il test del comando admin T4.7.

- Test: esegui comando admin → verifica record Tenant/User/Membership creati → verifica login del cliente → verifica moduli abilitati

---

### T6.5 — Test cross-tenant isolation E2E

**Deps**: T6.1  
**Size**: M  

- Creare 2 tenant
- Tentare accesso dati di tenant B da tenant A → deve fallire (404 o forbidden)
- Estendere il test RLS unit a livello E2E

---

### T6.6 — Security review checklist

**Deps**: T6.5  
**Size**: M  

- CSP headers configurati
- HSTS, X-Frame-Options
- Rate limiting su `/api/auth/*` (es. via `@upstash/ratelimit` o Vercel native)
- Cloudflare Turnstile su `/login` se serve (signup è meno critico dato che è admin-led)
- Audit npm/pnpm (`pnpm audit`)
- Verifica nessun secret nel client bundle (`grep` su build output)

---

### T6.7 — Performance review

**Deps**: T6.5  
**Size**: M  

- Lighthouse audit ≥ 90 su dashboard (la pagina più importante)
- Bundle analyzer: principal chunks < 300KB gzipped
- DB query review (slow query log su Postgres — `log_min_duration_statement` in Docker o nel provider managed)
- Indici mancanti aggiunti

> **Cambio**: niente target Lighthouse 90 su "landing" (rimossa).

---

### T6.8 — Backup verificato + runbook incident

**Deps**: T6.5  
**Size**: M  

- Verificare strategia backup del provider Postgres di produzione (pg_dump schedulato o backup managed)
- Test restore in DB di staging
- Scrivere runbook per 5 scenari incident in `guides/runbook.md`

---

### T6.9 — Commit Phase 6 + CI/CD setup

**Deps**: tutti T6.*  
**Size**: M  

- GitHub Actions: lint, typecheck, test su PR
- Deploy automatico Vercel su merge main
- Migration Prisma auto-applicata (con safe-mode)
- ✅

---

# Fase 7 — Launch Prep (primo cliente)

**Obiettivo**: tutto il non-tecnico necessario per onboardare il primo cliente reale.

**Durata stimata**: 1 settimana | **Branch consigliato**: `feat/launch-prep`

> **Refresh strategico drastico**: Fase 7 è stata ridotta da 8 a 4 task attivi. Email transazionali, KB, video tutorial, marketing site SEO sono deferred o rimossi. La task "3 clienti pilota" diventa "primo cliente onboarded".

---

### T7.1 — Privacy policy + Terms of Service + DPA finalizzati

**Deps**: T6.9  
**Size**: M  

- Revisione legale (consulenza esterna 3-4h consigliata)
- Pubblicazione su `/privacy`, `/terms`, `/dpa` (anche minime)

> **Cambio**: Size declassato da L a M (versione minima legale, non da SaaS pubblico).

---

### T7.2 ⏭ DEFERRED — Email transazionali finali

> **Decisione**: con onboarding admin-led e fatturazione manuale, le email transazionali non sono blocker per il go-live. Si attiva con Resend (T1.16) quando serve.

---

### T7.3 ⏭ DEFERRED — Knowledge base completata (30 articoli)

> **Decisione**: con un solo cliente al lancio, supporto 1:1. Si valuta quando ce ne sono 3+.

---

### T7.4 ⏭ DEFERRED — Video tutorial (5 minimi)

> **Decisione**: stesso razionale di T7.3.

---

### T7.5 — Setup supporto: email + pagina /contact minimale

**Deps**: nessuna (parallelo)  
**Size**: S  

- `support@coordinate.app` forward (anche su email personale)
- Pagina `/contact` minimale (form mailto o equivalente)

> **Cambio**: niente widget Crisp/Intercom — vendita boutique, email basta.

---

### T7.6 ❌ REMOVED — Marketing site refinement + SEO base

> **Decisione**: niente marketing site nell'MVP (vedi T5.9). Niente SEO.

---

### T7.7 — Primo cliente onboarded

**Deps**: tutti i task attivi della Fase 7  
**Size**: variabile (giorni)  

> **Cambio rispetto al piano originale** ("Identificare 3 clienti pilota + contratti firmati"): con il modello boutique a ~5 clienti, l'obiettivo del go-live è **1 cliente reale**, non 3 pilota.

Lavoro:
- Contratto firmato col primo cliente
- Esecuzione comando admin T4.7 per creare il tenant del cliente
- Setup branding + utenti + moduli abilitati col cliente in call
- Sessione training iniziale (2h)
- Fattura emessa (canone annuale + eventuale setup fee modulo custom)

**Done when**:
- Cliente accede al suo tenant e usa quotidianamente i moduli
- Fattura inviata al cliente

---

### T7.8 — Go-live + 30 giorni di monitoring intensivo

**Deps**: T7.1-T7.7  
**Size**: ongoing  

- Switch DNS produzione (se non già fatto)
- Tenant del primo cliente attivo
- Monitoraggio attivo Sentry + uptime
- Daily check email di supporto
- Fine MVP a 30gg con 0 bug critici → ✅ celebrazione

---

## Note generali per Claude Code che esegue questi task

Le regole vincolanti sono in [task-workflow.md](task-workflow.md). Sintesi:

- **Un task = un branch dedicato** `feature|fix|chore|docs/T<x.y>-<slug>`, partendo da `develop` aggiornato.
- **Claude non mergi mai**: né su `develop`, né su `main`. Pusha il branch, consegna all'utente, si ferma.
- **L'utente fa la review e poi mergi su `develop`** con `--no-ff`. A fine fase, l'utente fa la review complessiva e mergi `develop → main` + tag `v0.X.0`.
- **Leggere prima i documenti di riferimento** indicati dal task (architecture.md, mvp-scope.md, modules-catalog.md, pricing.md).
- **Non andare oltre lo scope**. Bug correlati vanno in `guides/known-issues.md`, non risolti nel task corrente.
- **Verificare ogni acceptance criterion in modo esplicito** prima di proporre il commit.
- **Commit message** secondo Conventional Commits con `[T<x.y>]` nel footer (vedi task-workflow.md §5).
- **Aggiornare lo stato globale** in cima a questo file come ultimo commit del task.
- **In caso di blocco**, NON improvvisare scelte architetturali. Committare WIP, pushare, fermarsi (vedi task-workflow.md §10).
- **Se un task risulta più grande del previsto** (es. un M che si rivela L), spezzarlo creando T_x.y.a, T_x.y.b in questo file prima di proseguire.
- **Per task ⏭ DEFERRED**: NON eseguirli. Sono in attesa di un trigger esterno (richiesta cliente, scelta strategica). Se l'utente vuole attivarli, va rimosso il marker `⏭ DEFERRED` e aggiornato lo stato globale.
- **Per task ❌ REMOVED**: NON eseguirli. Sono fuori dall'architettura prevista. Se servono in futuro, va prima rivisto questo documento e l'architettura.
