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
- **Deps**: prerequisiti — altri task che devono essere `✅` prima di iniziare questo
- **Size**: `XS` (< 30min), `S` (30min-1h), `M` (1-3h), `L` (3-6h), `XL` (6h+, considerare di spezzare)
- **Files**: file principali da creare/modificare (non esaustivo, ma indicativo)
- **Done when**: criteri di completamento verificabili
- **Notes**: opzionale, gotcha, riferimenti

## Documenti di riferimento

Ogni task assume che Claude Code legga (o ricordi) questi documenti quando rilevante:
- `guides/architecture.md` — scelte architetturali, struttura monorepo, sistema moduli
- `guides/mvp-scope.md` — cosa è IN e OUT del MVP
- `guides/modules-catalog.md` — definizione dei moduli e loro dipendenze
- `guides/pricing.md` — tier, prezzi, modelli commerciali (solo per task billing)

## Stato globale

```
Fase 0  Monorepo Setup                 [✅] 8/8 task
Fase 1  Backend & Auth & Multi-Tenant  [ ] 7/18 task
Fase 2  Module Registry                [ ] 0/12 task
Fase 3  Moduli MVP                     [ ] 0/24 task
Fase 4  Billing & Onboarding & Admin   [ ] 0/16 task
Fase 5  Polish: i18n, search, theming  [ ] 0/10 task
Fase 6  Testing & Hardening            [ ] 0/9 task
Fase 7  Launch Prep                    [ ] 0/8 task
                                       --------------
                                       TOT 105 task
```

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
  - "tenants/*/modules/*"
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

### T1.8 — Setup tRPC base + integrazione con Next.js App Router

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

### T1.9 — Client tRPC nel frontend + TanStack Query provider

**Deps**: T1.8  
**Size**: M  
**Files**: `apps/web/src/lib/trpc-client.ts`, `apps/web/src/app/layout.tsx`  

- Creare client tRPC + React Query provider.
- Wrappare l'app in `<TRPCProvider>` nel layout root (sotto SessionProvider/ThemeProvider).
- Esempio di chiamata: `trpc.healthcheck.useQuery()` in una pagina di test.

**Done when**:
- Componente client può chiamare procedure tRPC e ricevere risposta

---

### T1.10 — Pagina di sign-up (email/password)

**Deps**: T1.4, T1.9  
**Size**: M  
**Files**: `apps/web/src/app/(auth)/signup/page.tsx`, `apps/web/src/app/(auth)/layout.tsx`  

- Form sign-up: email, password, nome, cognome, nome azienda.
- Validazione Zod.
- Submit → chiama Better-Auth sign-up + crea Tenant + crea Membership owner.
- Verifica email obbligatoria (Better-Auth invia email; per dev, log in console o usare Resend dev).
- Redirect dopo verifica → step di setup tenant (slug subdomain, P.IVA opzionale).

**Done when**:
- Sign-up flow end-to-end funziona
- Nuovo tenant creato in DB con owner

---

### T1.11 — Pagina di login + flusso OAuth Google/Microsoft

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

### T1.12 — Logout + gestione sessioni multi-tab

**Deps**: T1.11  
**Size**: S  
**Files**: `apps/web/src/components/layout/AppHeader.tsx`, hook `useSession`  

- Pulsante logout in header / user menu.
- Su logout, invalidate sessione Better-Auth, redirect a `coordinate.app/login`.
- Verifica multi-tab: logout in tab A → tab B perde sessione al refresh.

**Done when**:
- Logout funziona, redirect corretto

---

### T1.13 — RBAC: ruoli predefiniti + middleware tRPC `requirePermission`

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

### T1.14 — TanStack Query come sostituto di Zustand per dati server

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

### T1.15 — Setup Inngest per background jobs

**Deps**: T1.8  
**Size**: M  
**Files**: `packages/core/jobs/`, `apps/web/src/app/api/inngest/route.ts`  

- Installare `inngest` e `inngest-cli` (dev).
- Configurare client Inngest in `packages/core/jobs/client.ts`.
- Creare endpoint Next.js per Inngest webhook.
- Creare un job di test (`hello-world`) che logga in console.
- Dev: `npx inngest-cli dev` parallelamente al `pnpm dev`.

**Done when**:
- Job di test triggerato manualmente da Inngest dashboard si esegue

---

### T1.16 — Setup Resend per email transazionali

**Deps**: T1.4  
**Size**: M  
**Files**: `packages/core/email/`, `apps/web/src/server/email/`  

- Installare `resend` + `@react-email/components`.
- Creare API key Resend (account gratis ok per dev).
- Creare 2 template React Email: `WelcomeEmail`, `VerifyEmail`.
- Helper `sendEmail({ to, template, props })` in `packages/core/email`.
- Integrare con Better-Auth per email di verifica.

**Done when**:
- Sign-up invia email reale (dominio dev) e si vede in inbox

---

### T1.17 — Setup Sentry + PostHog (observability)

**Deps**: T1.8  
**Size**: M  
**Files**: `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`, integrazione PostHog  

- Installare Sentry per Next.js (`@sentry/nextjs`) + configurare DSN.
- Installare PostHog client + server (`posthog-js`, `posthog-node`).
- Eventi base PostHog: `signup_completed`, `tenant_created`, `login`.
- Verificare che errori arrivino su Sentry e eventi su PostHog.

**Done when**:
- Errore lanciato di test appare in Sentry
- Evento di test appare in PostHog

---

### T1.18 — Commit Phase 1 + smoke test end-to-end

**Deps**: tutti i T1.*  
**Size**: S  

- Smoke test: signup → email verify → login → arrivo su tenant subdomain → logout
- Commit + push branch + opzionalmente merge in main
- Marcare Fase 1 come ✅

---

# Fase 2 — Module Registry

**Obiettivo**: implementare il sistema di moduli con manifest, e migrare i 3 moduli esistenti (CRM contacts/leads, warehouse, activities/tasks) al nuovo pattern.

**Durata stimata**: 2-3 settimane | **Branch consigliato**: `feat/module-registry`

---

### T2.1 — Definire type ModuleManifest e contract del registry

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

### T2.2 — Implementare ModuleRegistry con loader

**Deps**: T2.1  
**Size**: L  
**Files**: `packages/core/module-registry/registry.ts`, `packages/core/module-registry/loader.ts`  

- `registerModule(manifest)` per ogni manifest
- `loadModules()` enumera i `packages/modules/*` e i `tenants/*/modules/*` e li registra
- Validazione: nessun duplicato di id, dipendenze esistono, no cicli
- API: `getEnabledModules(tenantId)`, `getApiRouter(tenantId)`, `getNavigation(user)`

**Done when**:
- Test unitario: registrare un manifest fake, recuperare via API

---

### T2.3 — Build-time route generation script

**Deps**: T2.2  
**Size**: L  
**Files**: `apps/web/scripts/generate-routes.ts`, hook `prebuild`  

Script che:
- Importa il `ModuleRegistry`
- Per ogni modulo registrato, legge `routes[]` dal manifest
- Genera file in `apps/web/src/app/(modules)/<module-id>/<path>/page.tsx` che re-esporta il componente dichiarato nel manifest
- Hooka in `package.json` come `"prebuild": "tsx scripts/generate-routes.ts"` e `"predev": "tsx scripts/generate-routes.ts"`

**Done when**:
- Script gira a build e genera le cartelle
- Le rotte generate funzionano in browser

---

### T2.4 — Sistema di merge dello schema Prisma multi-modulo

**Deps**: T2.2  
**Size**: L  
**Files**: `packages/database/scripts/merge-schemas.ts`  

Script che:
- Cerca tutti i `prisma/schema.fragment.prisma` nei moduli
- Li concatena con lo schema base in `packages/database/prisma/schema.prisma` (generato)
- Hook in `predb:generate`

**Done when**:
- Aggiungere un fragment in un modulo lo include in schema generato
- Migration applicata correttamente

---

### T2.5 — Creare packages/modules/crm-contacts (scaffold)

**Deps**: T2.3, T2.4  
**Size**: M  
**Files**: `packages/modules/crm-contacts/`  

- `package.json`, `tsconfig.json`, `src/manifest.ts`, `src/prisma/schema.fragment.prisma`, `src/router.ts`, `src/pages/`
- Manifest minimale che dichiara: 1 rotta (`/crm/customers`), 1 voce nav, permessi `crm:contact:read|write|delete`

**Done when**:
- Modulo riconosciuto dal registry
- Rotta `/crm/customers` raggiungibile (placeholder vuoto)

---

### T2.6 — Migrare modello Contact al modulo crm-contacts

**Deps**: T2.5  
**Size**: M  
**Files**: `packages/modules/crm-contacts/src/prisma/schema.fragment.prisma`, migration  

- Definire Contact (persona+azienda in un modello con discriminator `type`)
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
- Modelli: Lead, Deal, PipelineStage
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
- Procedure tRPC + custom fields wrapper

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

### T2.11 — Sistema di event bus interno

**Deps**: T2.2  
**Size**: M  
**Files**: `packages/core/events/bus.ts`  

- Implementare event bus in-process (EventEmitter pattern, async-safe)
- Tipi: `tenantEvent<Name, Payload>` con Zod schemas
- I moduli si iscrivono nel manifest via `eventHandlers`
- Esempio: `crm-pipeline` emette `lead.status.changed`

**Done when**:
- Event bus testato unit, almeno 1 modulo emette + 1 si iscrive

---

### T2.12 — Commit Phase 2 + verifica navigazione dinamica

**Deps**: tutti i T2.*  
**Size**: S  

- Verificare che la sidebar mostri voci nav generate dai manifest (non hardcoded)
- Smoke test su tutte le pagine migrate
- Commit + merge
- Marcare Fase 2 come ✅

---

# Fase 3 — Costruzione dei moduli mancanti del MVP

**Obiettivo**: portare gli 8 moduli MVP a livello "vendibile". Include nuovi moduli (calendar, dashboard pulito, quotes, it-anagrafica-check) e potenziamenti dei moduli migrati.

**Durata stimata**: 4-5 settimane | **Branch consigliato**: `feat/mvp-modules`

---

### T3.1 — crm-contacts: aggiungere relazione Persona ↔ Azienda

**Deps**: T2.7  
**Size**: M  
**Files**: schema fragment + UI dettaglio contatto  

Vedi `mvp-scope.md` §5 M1 per scope.

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
- Default 6 stadi creati al sign-up

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

### T3.10 — activities: promemoria via notifications

**Deps**: T2.9, T1.16  
**Size**: M  

- Job Inngest che ogni ora scansiona activities con `dueDate` entro X
- Crea notifica in-app + opzionalmente email per Task in scadenza < 24h

---

### T3.11 — Modulo calendar (nuovo): vista mese + settimana

**Deps**: T2.9  
**Size**: L  
**Files**: `packages/modules/calendar/`  

- Modulo calendar (dep on activities)
- Vista mese (FullCalendar o lib equivalente)
- Vista settimana
- Eventi = activities di tipo Meeting/Call con dueDate
- Click → drawer activity dettaglio

---

### T3.12 — calendar: creazione evento dal calendario

**Deps**: T3.11  
**Size**: M  

- Click su slot vuoto → modal nuova activity Meeting/Call

---

### T3.13 — Modulo dashboard MVP

**Deps**: T2.8, T2.7, T2.9  
**Size**: L  
**Files**: `packages/modules/dashboard/`  

- 6 widget fissi (vedi mvp-scope §5 M5)
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

### T3.16 — Modulo quotes (nuovo): modello e UI base

**Deps**: T2.7, T2.10  
**Size**: L  
**Files**: `packages/modules/quotes/`  

- Modelli Quote + QuoteLine
- UI lista preventivi + creazione/modifica
- Righe: prodotto da magazzino o testo libero, quantità, prezzo, sconto

---

### T3.17 — quotes: generazione PDF brandato

**Deps**: T3.16  
**Size**: L  

- Template PDF con react-pdf o puppeteer/playwright server
- Brand: logo + colore primario tenant
- Numerazione preventivo configurabile

---

### T3.18 — quotes: invio via email + tracking stato

**Deps**: T3.17, T1.16  
**Size**: M  

- Bottone "Send to client" → email con PDF allegato
- Stato preventivo: bozza → inviato → accettato/rifiutato
- Storico email inviate

---

### T3.19 — Modulo it-anagrafica-check (nuovo): validazione P.IVA/CF

**Deps**: T2.7  
**Size**: M  
**Files**: `packages/modules/it-anagrafica-check/`  

- Validazione P.IVA via checksum
- Verifica via VIES (`https://ec.europa.eu/taxation_customs/vies/api`)
- Validazione CF via algoritmo
- Endpoint tRPC `it.anagrafica.verifyPIVA`

---

### T3.20 — it-anagrafica-check: autocompletamento azienda da P.IVA

**Deps**: T3.19  
**Size**: L  

- Integrazione provider (openapi.it o equivalente)
- API key configurata in tenant settings
- UI: bottone "Verifica e compila" su form azienda
- Quota mensile per tenant (counter su Tenant model)

---

### T3.21 — Custom fields: implementazione 5 tipi base

**Deps**: T2.7  
**Size**: L  
**Files**: `packages/core/custom-fields/`  

- Modello CustomFieldDefinition (per tenant + entityType)
- 5 tipi: text, number, date, dropdown, boolean
- Validazione Zod compilata da definitions
- UI builder in tenant settings
- Form/table dinamici nei moduli (Contact, Deal, Activity, Product, Quote)

---

### T3.22 — Search globale (Postgres tsvector)

**Deps**: T2.7, T2.8, T2.10  
**Size**: L  

- Colonna `searchable tsvector` generata via trigger su Contact/Deal/Product/Quote
- Indice GIN
- Procedure tRPC `search.global({ query })`
- Componente header search bar con risultati raggruppati

---

### T3.23 — Notifiche in-app (campanella + dropdown)

**Deps**: T1.16  
**Size**: M  

- Modello Notification (recipient, type, message, link, readAt)
- UI campanella header con badge unread
- Mark as read
- Eventi che generano notifiche: activity reminder, mention (futuro), deal won

---

### T3.24 — Commit Phase 3 + acceptance review

**Deps**: tutti T3.*  
**Size**: S  

- Tutte le pagine MVP funzionanti su DB reale
- Smoke test completo: signup → contatto → lead → deal → preventivo → PDF
- Merge in main
- ✅

---

# Fase 4 — Billing, Onboarding self-serve, Admin tenant

**Obiettivo**: rendere il prodotto vendibile self-serve. Stripe Checkout, onboarding completo, pagina admin tenant.

**Durata stimata**: 3-4 settimane | **Branch consigliato**: `feat/billing-and-onboarding`

---

### T4.1 — Setup Stripe account + prodotti/prezzi

**Deps**: T3.24  
**Size**: M  

- Account Stripe (test mode)
- Creare prodotti su Stripe: Starter, Pro, Business (con metadata tier)
- Creare prezzi mensili + annuali per ciascuno
- Salvare price IDs in env / DB settings

---

### T4.2 — Modello Subscription nel DB

**Deps**: T4.1  
**Size**: M  

- Modello Subscription (tenantId, stripeSubId, plan, status, currentPeriodEnd, …)
- Webhook handler che aggiorna da eventi Stripe

---

### T4.3 — Stripe Checkout per nuovo abbonamento

**Deps**: T4.2  
**Size**: M  
**Files**: route handler `/api/checkout`  

- Crea sessione Checkout, redirect a Stripe
- Success URL → completa setup tenant
- Cancel URL → torna a pricing page

---

### T4.4 — Webhook Stripe handler + idempotenza

**Deps**: T4.3  
**Size**: L  
**Files**: route `/api/webhooks/stripe`  

- Validazione firma webhook
- Gestione eventi: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- Idempotency via tabella `StripeWebhookLog`

---

### T4.5 — Stripe Customer Portal per gestione abbonamento

**Deps**: T4.4  
**Size**: S  

- Bottone "Gestisci abbonamento" in settings tenant
- Apre portal Stripe (no UI custom)

---

### T4.6 — Trial 14 giorni gestito dal sistema (non Stripe trial)

**Deps**: T4.2  
**Size**: M  

- Campo `trialEndsAt` su Tenant
- Banner "Trial scade in N giorni"
- Email transazionale 3gg prima della scadenza
- Job Inngest che alla scadenza disabilita features (read-only) se nessuna sub attiva

---

### T4.7 — Onboarding wizard post-signup

**Deps**: T4.3  
**Size**: L  

- Step 1: dati azienda (P.IVA, indirizzo) — usa it-anagrafica-check
- Step 2: scelta tier (Starter/Pro) + carta
- Step 3: invito team (skip ok)
- Step 4: tour guidato in-app (3-4 step)

---

### T4.8 — Pagina tenant admin: dati azienda e branding

**Deps**: T3.21  
**Size**: M  

- Settings: nome, P.IVA, CF, indirizzo, fuso orario, lingua
- Upload logo (S3/R2)
- Color picker per colore primario
- Preview live del branding

---

### T4.9 — Pagina tenant admin: gestione team

**Deps**: T1.13  
**Size**: M  

- Lista membri con ruolo
- Invita per email (con scelta ruolo)
- Modifica ruolo / rimuovi membro
- Transfer ownership

---

### T4.10 — Pagina tenant admin: abilitazione moduli

**Deps**: T2.12  
**Size**: M  

- Lista moduli disponibili per il tier
- Toggle on/off (con conferma)
- Se modulo richiesto per tier non disponibile, mostra upgrade prompt

---

### T4.11 — Pagina tenant admin: billing overview

**Deps**: T4.4  
**Size**: M  

- Mostra: piano attuale, prossima fatturazione, importo, metodo di pagamento
- Storico fatture (lista, link a PDF Stripe)
- Cambio piano (link Stripe portal)

---

### T4.12 — Cloudflare R2 setup per file storage

**Deps**: T3.21  
**Size**: M  

- Account R2 + bucket
- API keys
- Helper upload signed URL in `packages/core/file-storage`
- Migration: spostare upload logo lì

---

### T4.13 — Knowledge base seed + componente in-app

**Deps**: T0.8  
**Size**: M  

- Tabella Article (slug, title, content markdown, category, locale)
- Pagina pubblica `/help` con ricerca
- Drawer "Aiuto" in-app dalla header
- Seed iniziale: 30 articoli minimi (15 IT + 15 EN) — anche placeholder ok per ora

---

### T4.14 — Status page setup (statuspage.io o equivalente)

**Deps**: nessuna (parallelo)  
**Size**: S  

- Account statuspage.io free / equivalente
- Componenti: web, db, email, payments
- Link da footer dell'app e pagina pubblica

---

### T4.15 — GDPR: export dati tenant + privacy/terms pages

**Deps**: T1.18, T4.8  
**Size**: L  

- Endpoint admin "Export my data" → genera ZIP CSV di tutti i dati
- Pagine pubbliche `/privacy`, `/terms`, `/dpa` (markdown content)
- Cookie banner per analytics (PostHog)

---

### T4.16 — Commit Phase 4 + acceptance: comprare un piano end-to-end

**Deps**: tutti T4.*  
**Size**: S  

- Test in modalità test Stripe: signup → checkout → carta test → activation → uso → cancel → resync
- ✅

---

# Fase 5 — Polish: i18n, search, theming, audit log

**Obiettivo**: portare l'UX al livello "vendibile". Internazionalizzazione, theming applicato, audit log visibile, polish generale.

**Durata stimata**: 2 settimane | **Branch consigliato**: `feat/polish`

---

### T5.1 — Setup next-intl + estrazione stringhe IT default

**Deps**: T4.16  
**Size**: L  

- Installare next-intl
- Configurare locale routing (default `it`, alternativa `en`)
- Estrarre tutte le stringhe UI in messages/it.json
- Traduzione (anche auto via DeepL/Claude) di tutte le stringhe in en.json
- I moduli portano le proprie traduzioni in `packages/modules/*/messages/`

---

### T5.2 — i18n: formato date/numeri/valute per locale

**Deps**: T5.1  
**Size**: S  

- date-fns con locale
- Intl.NumberFormat
- Intl.DateTimeFormat per fuso orario tenant

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
- Mobile responsive verificato

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

- Logo (SVG)
- Favicon set completo (multiple sizes)
- OG image per share su social

---

### T5.8 — Pagina `/pricing` pubblica

**Deps**: nessuna (parallelo)  
**Size**: M  

- Versione semplificata da pricing.md §11
- Confronto tier
- FAQ
- CTA al signup

---

### T5.9 — Landing page `/` pubblica

**Deps**: T5.8  
**Size**: L  

- Hero, features, testimonials (anche placeholder), pricing teaser, CTA
- SEO base (meta tags, sitemap, robots.txt)
- Performance (Lighthouse ≥ 90)

---

### T5.10 — Commit Phase 5 + UX review

**Deps**: tutti T5.*  
**Size**: S  

- Walkthrough completo come utente nuovo
- ✅

---

# Fase 6 — Testing & Hardening

**Obiettivo**: rendere il prodotto sicuro e robusto. Test E2E, security review, performance check.

**Durata stimata**: 1-2 settimane | **Branch consigliato**: `feat/hardening`

---

### T6.1 — Setup Playwright + test E2E sul flusso signup

**Deps**: T5.10  
**Size**: M  

- Setup Playwright in `apps/web`
- Test: signup → email verify (intercept) → tenant created → login → dashboard

---

### T6.2 — E2E: contatto + lead + deal + preventivo

**Deps**: T6.1  
**Size**: M  

- Test golden path commerciale completo

---

### T6.3 — E2E: warehouse + movimento stock

**Deps**: T6.1  
**Size**: S  

- Test golden path magazzino

---

### T6.4 — E2E: it-anagrafica-check con mock VIES

**Deps**: T6.1  
**Size**: S  

- Mock provider esterno
- Verify P.IVA + autocompletamento

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
- Cloudflare Turnstile su signup
- Audit npm/pnpm (`pnpm audit`)
- Verifica nessun secret nel client bundle (`grep` su build output)

---

### T6.7 — Performance review

**Deps**: T6.5  
**Size**: M  

- Lighthouse audit ≥ 90 su landing e dashboard
- Bundle analyzer: principal chunks < 300KB gzipped
- DB query review (slow query log su Postgres — `log_min_duration_statement` in Docker o nel provider managed)
- Indici mancanti aggiunti

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

# Fase 7 — Launch Prep

**Obiettivo**: tutto il non-tecnico necessario per lanciare. Legal, contenuti, primi clienti.

**Durata stimata**: 1-2 settimane | **Branch consigliato**: `feat/launch-prep`

---

### T7.1 — Privacy policy + Terms of Service + DPA finalizzati

**Deps**: T6.9  
**Size**: L  

- Revisione legale (consulenza esterna 4-6h consigliata)
- Pubblicazione su /privacy, /terms, /dpa

---

### T7.2 — Email transazionali finali (tutte e 8)

**Deps**: T1.16  
**Size**: M  

- welcome, verify email, password reset, invite team, payment success, payment failed, trial ending, account deleted
- Tutte brandate, IT + EN

---

### T7.3 — Knowledge base completata (30 articoli minimi)

**Deps**: T4.13  
**Size**: L  

- 30 articoli reali (15 IT + 15 EN)
- Categorie: Getting Started, CRM, Magazzino, Preventivi, Billing, Account

---

### T7.4 — Video tutorial (5 minimi)

**Deps**: T7.3  
**Size**: L  

- Signup walk-through (3 min)
- Aggiungi cliente (2 min)
- Gestisci pipeline (3 min)
- Crea preventivo (3 min)
- Gestisci billing (2 min)

---

### T7.5 — Setup supporto: email + Crisp/Intercom widget

**Deps**: nessuna (parallelo)  
**Size**: S  

- support@coordinate.app forward
- Widget chat opzionale (Crisp gratis ok)
- Pagina /contact

---

### T7.6 — Marketing site refinement + SEO base

**Deps**: T5.9  
**Size**: M  

- Sitemap, robots.txt
- Schema.org markup
- Open Graph + Twitter cards
- Analytics (PostHog) attivo

---

### T7.7 — Identificare 3 clienti pilota + contratti firmati

**Deps**: nessuna (parallelo all'intero progetto)  
**Size**: L  

- 5 prospect call durante lo sviluppo
- 3 conversioni con contratto + carta inserita
- 1 dei 3 su Pro tier

---

### T7.8 — Go-live + 30 giorni di monitoring intensivo

**Deps**: T7.1-T7.7  
**Size**: ongoing  

- Switch DNS produzione
- Tenant pilota invitati
- Monitoraggio attivo Sentry + uptime
- Daily check supporto email
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
