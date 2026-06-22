# Coordinate — Go-Forward Tasks (single-domain, boutique)

**Questo è il piano di lavoro attivo.** Nasce dal pivot architetturale del 2026-05-30 (tenant da sottodominio → **dominio unico con tenant nel path**, `coordinate.app/t/<slug>/…`) e ingloba l'intera roadmap di prodotto ancora valida, **allineata allo scope boutique** di `mvp-scope.md`.

- `implementation-tasks.md` è diventato **puro archivio** del piano originale (architettura a sottodominio + scope SaaS pieno). Si consulta solo per rollback o per lo spec dettagliato dei task qui marcati DEFERRED.
- I task fuori dallo scope boutique (Stripe, trial, self-serve, i18n EN, pricing/landing pubbliche, custom fields dinamici, email transazionali, KB/video) **non sono stati cancellati**: sono `⏭ DEFERRED` con motivo, così si riattivano quando un cliente li paga o cambia il modello.

> ⚠️ **Lettura obbligatoria prima di eseguire qualunque task**: [task-workflow.md](task-workflow.md). Naming branch, convenzioni commit, regole di merge, cosa Claude può e non può fare.

> ⚠️ **Nota sugli ID**: in questo file **`T1.1`–`T1.8` = migrazione single-domain** (Fase 1). I riferimenti `Deps` alle fondamenta originali (auth, RBAC, RLS, schema base, module-registry) puntano alla sezione *Fondamenta completate* / all'archivio, **non** ai T1.x di questo file. Sono annotati come `✅`.

---

## Contesto della migrazione single-domain

Per una boutique con ~5 clienti il routing a sottodominio costa più di quanto renda (DNS wildcard, TLS wildcard, cookie cross-subdomain). Il dominio unico con tenant nel path è più semplice, **stateless** (slug nell'URL, niente cookie di tenant), rende esplicita "la sezione di ognuno" ed è comodo per l'operatore (più clienti in tab diverse).

**Punto chiave**: tutto il server gira già attorno all'header **`x-tenant-slug`** (tRPC context, layout SSR, `useCan`, `tenant-check`). Il sottodominio serve solo a *produrlo*. Cambiamo da dove arriva lo slug e come raggiunge l'API; RLS, `withTenant`, `tenantProcedure` restano nella sostanza invariati. Decisioni chiuse: stile URL **path** `coordinate.app/t/<slug>`; contratto interno `x-tenant-slug`; **fix membership** in `tenantProcedure` incluso. Dettaglio in `architecture.md` §3.

**Cosa NON si tocca**: RLS Postgres, `withTenant`, schema Prisma, moduli, module-registry, monorepo Turborepo.

---

## Convenzioni dei task

ID `T<fase>.<numero>` · **Deps** (prerequisiti `✅`) · **Size** (`XS`<30m, `S` 30–60m, `M` 1–3h, `L` 3–6h, `XL` 6h+) · **Files** · **Done when** · **Notes**. Un task = un branch `feat|fix|chore|docs/T<x.y>-<slug>` da `develop` aggiornato. Claude non mergi mai: pusha e si ferma.

**Legenda stato**: `✅` completato · `⏭ DEFERRED` fuori scope MVP boutique (preservato, non attivo) · *(senza marker)* = da fare.

---

## Fondamenta completate (archiviate in implementation-tasks.md)

Già fatte, non rientrano nel lavoro attivo — riassunte qui per le dipendenze.

- **Fase 0 — Monorepo** ✅ (pnpm + Turborepo)
- **Fase 1 originale — Backend/Auth/Multi-tenant** ✅ (Prisma+RLS, Better-Auth+organizations, tRPC, Inngest, Sentry/PostHog). **Superati dalla migrazione**: il middleware a sottodominio (orig. T1.5) e i redirect a sottodominio (orig. T1.10/T1.11). **Deferred**: Resend/email transazionali (orig. T1.16).
- **Fase 2 registry** — `module-registry` types+loader ✅, pattern mounting rotte ✅, `crm-contacts` scaffold ✅, modello `Contact`+RLS ✅. Schema-merge multi-modulo = deferred (un solo `schema.prisma` con marker).

---

## Stato globale

```
Fase 1   Single-domain migration          [x] 8/8   attivi
Fase 2   Completamento migrazione moduli  [x] 6/6   attivi
Fase 3   Moduli MVP boutique              [x] 18/18 attivi  (+6 deferred)
Fase 4   Admin tenant, team & provisioning[x] 6/6   attivi  (+12 deferred)
Fase 4.5 Moduli verticali primi clienti  [x] 5/5   attivi
Fase 5   Polish                           [ ] 0/8   attivi  (+2 deferred)
Fase 6   Testing & Hardening              [~] 1/8   attivi  (+1 deferred)  (T6.6 headers+rate-limit)
Fase 7   Launch white-glove               [ ] 0/4   attivi  (+4 deferred)
                                          ----------------------------------
                                          63 attivi · 25 deferred · 88 totali
```

> **Aggiornamento 2026-06-13 (b)** — identificati i **due primi clienti reali**: (A) azienda metalmeccanica che produce componenti su commessa per altre aziende; (B) attività che compra e rivende oggetti online. La roadmap è stata riallineata su di loro: **Fase 4** ridotta al blocco che monetizza (team multi-utente con **slot a pagamento** + sezione **super-admin** di piattaforma), e nuova **Fase 4.5** coi moduli verticali che chiudono la vendita (preventivi, ordini/margini, commesse, allegati). Tagliati dall'MVP: branding (T4.8) e Cloudflare R2 (T4.12, sostituito da **Vercel Blob** dentro T4.24). Vedi `mvp-scope.md` §3/§4 e `pricing.md` §2.

> Ordine d'esecuzione consigliato: prima **Fase 1** (migrazione), così tutto il lavoro di prodotto successivo nasce già sotto `/t/[tenant]`. Poi Fase 2 → 7.

---

# Fase 1 — Single-domain tenant routing

**Obiettivo**: l'app vive su un solo dominio. Login da `coordinate.app/login`, poi `coordinate.app/t/<slug>/dashboard`. Sparisce ogni logica a sottodominio. La membership sul tenant è verificata server-side.

**Branch di fase**: `feat/single-domain-routing`

---

### T1.1 ✅ — Ristrutturare le route sotto il segmento `/t/[tenant]`

**Deps**: nessuna
**Size**: L
**Files**: `apps/web/src/app/t/[tenant]/layout.tsx` (nuovo), `apps/web/src/app/layout.tsx`, spostamento di `dashboard/`, `crm/`, `tasks/`, `warehouse/`, `(modules)/` sotto `t/[tenant]/`

- Creare il segmento dinamico `apps/web/src/app/t/[tenant]/`.
- Spostarci sotto (con `git mv`) le pagine tenant-scoped: `dashboard`, le rotte `(modules)/*`, e le legacy `crm/`, `tasks/`, `warehouse/`.
- Nuovo `t/[tenant]/layout.tsx`: risolve il tenant (da `x-tenant-slug` / `params.tenant`), `notFound()` se assente/inesistente. **Spostare qui** la risoluzione tenant oggi nel root `layout.tsx` **e l'app shell** (`MainLayout`/sidebar), che è tenant-scoped.
- Root `layout.tsx`: resta `html`/`body`/provider globali, **tenant-agnostico**.
- Restano in root: `(auth)`, `/`, `/pricing`, `/privacy`, `/terms`, `/api/*`.

**Done when**: `/t/<slug>/dashboard` rende la dashboard; pagine pubbliche/auth in root senza app shell; `pnpm typecheck` verde.
**Notes**: aggiornare `apps/web/src/app/(modules)/README.md` → `app/t/[tenant]/(modules)/<id>/<path>/page.tsx`.

---

### T1.2 ✅ — Middleware: estrazione tenant dal path

**Deps**: T1.1
**Size**: M
**Files**: `apps/web/src/middleware.ts`

- Rimuovere `extractSubdomain()` e ogni logica host/`lvh.me`/`coordinate.app`.
- Estrarre lo slug dal **path**: match `^/t/([^/]+)(/|$)` → header `x-tenant-slug`.
- Bypass senza header: `/`, `/login`, `/signup`, `/pricing`, `/privacy`, `/terms`, `/api/auth/*`, `/api/trpc/*`, `/_next/*`, `favicon`.

**Done when**: `/t/demo/dashboard` → server riceve `x-tenant-slug: demo`; pagine pubbliche senza header; nessun riferimento host.
**Notes**: il middleware resta Edge; la risoluzione `slug → tenant.id` resta server-side (stessa nota in `known-issues.md`). Cambia solo la sorgente dello slug.

---

### T1.3 ✅ — Client tRPC: inviare `x-tenant-slug`

**Deps**: T1.2
**Size**: S
**Files**: `apps/web/src/lib/trpc` (setup client/provider, `httpBatchLink`)

- Aggiungere `headers()` all'`httpBatchLink`: leggere lo slug da `window.location.pathname` (`/t/<slug>/…`) e impostare `x-tenant-slug` se presente.
- Motivo: l'URL di `/api/trpc` non contiene il tenant; col sottodominio l'host lo portava da solo.

**Done when**: query `tenantProcedure` da pagina `/t/<slug>/…` ok; da pagina pubblica context tenant assente.
**Notes**: per chiamate tRPC server-side future, passare lo slug dai route params del segmento `[tenant]`.

---

### T1.4 ✅ — `tenantProcedure`: verifica membership (sicurezza)

**Deps**: T1.3
**Size**: M
**Files**: `packages/api/src/trpc.ts`, `packages/database/test/rls.test.ts`

- In `tenantProcedure`, dopo `resolveTenantBySlug`, verificare che `ctx.session.user` abbia una `Membership` sul `tenant.id` (`prismaAdmin`, come `onboarding.getMyMembership`). Altrimenti `TRPCError FORBIDDEN`.
- Test: utente del tenant A che richiede lo slug del tenant B → `FORBIDDEN`.

**Done when**: accesso cross-tenant bloccato a livello procedure; test verde.
**Notes**: chiude il gap di `known-issues.md`. Con lo slug nel path l'URL è banalmente manipolabile: la RLS protegge per `tenantId`, il membership check impedisce di puntare a un tenant non proprio.

---

### T1.5 ✅ — Auth e cookie single-origin (cleanup)

**Deps**: nessuna (consigliato dopo T1.2)
**Size**: S
**Files**: `packages/core/src/auth/index.ts`, `apps/web/.env(.example)`, `packages/database/.env.example`

- Rimuovere da `auth/index.ts`: `advanced.crossSubDomainCookies`, `cookieDomain` (`BETTER_AUTH_COOKIE_DOMAIN`), `trustedOrigins` wildcard.
- `trustedOrigins`: solo l'origin unico (o vuoto se same-origin).
- Env: rimuovere `BETTER_AUTH_COOKIE_DOMAIN`, semplificare `BETTER_AUTH_TRUSTED_ORIGINS`.

**Done when**: login+sessione+logout su singolo origin; nessun riferimento cross-subdomain.
**Notes**: cookie host-only (default), corretto con dominio unico.

---

### T1.6 ✅ — URL helper + redirect pagine auth

**Deps**: T1.1
**Size**: M
**Files**: `apps/web/src/lib/tenant-url.ts`, `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`, `app/page.tsx`, header/logout

- `tenant-url.ts`: `getTenantDashboardUrl(slug)` → `/t/${slug}/dashboard` (relativo); `getLoginUrl()` → `/login`. Via `isLocalDev()`/sottodominio.
- `login`: redirect a `/t/<slug>/dashboard`; tenant picker linka al path; etichetta non più `slug.coordinate.app`.
- `signup`: redirect a `/t/<slug>/dashboard`. `page.tsx`: destinazioni aggiornate. Logout → `/login`.

**Done when**: signup → `/t/<slug>/dashboard`; login mono-tenant → redirect diretto; multi-tenant → picker → path; logout → `/login`.
**Notes**: rivedere testi UI che mostrano `slug.coordinate.app`.

---

### T1.7 ✅ — Allineamento test, seed, env e doc

**Deps**: T1.4, T1.5, T1.6
**Size**: S
**Files**: `packages/database/test/rls.test.ts`, `packages/database/prisma/seed.ts`, `.env.example` (tutti), `docker-compose.yml`/README dove citano `lvh.me`

- Aggiornare riferimenti in seed/test che assumevano URL a sottodominio (`coordinate.app`/`lvh.me`).
- Rimuovere note su DNS wildcard / `*.lvh.me` da env e doc dev.

**Done when**: `pnpm -F @coordinate/database test` passa; `pnpm typecheck`/`lint` verdi sui package toccati.

---

### T1.8 ✅ — Smoke test end-to-end + chiusura fase

**Deps**: tutti i T1.*
**Size**: S

- Smoke: `pnpm dev` → `/login` → login demo → `/t/demo/dashboard` → (se multi-tenant) switch → logout → `/login`.
- Cross-tenant: utente senza membership su `/t/<altro>/…` → bloccato.
- `pnpm typecheck` sui package toccati. Marcare **Fase 1 ✅**.

**Done when**: tutti i flussi verdi.

---

# Fase 2 — Completamento migrazione moduli

**Obiettivo**: portare i moduli esistenti (CRM contacts/leads, warehouse, activities) al pattern module-registry, con le pagine sotto `/t/[tenant]`. (Era Fase 2 T2.7–T2.12 dell'archivio.)

**Branch di fase**: `feat/module-migration`

---

### T2.7 ✅ — Migrare logica Customers nel modulo crm-contacts

**Deps**: ✅ T2.6 (modello Contact)
**Size**: L
**Files**: `packages/modules/crm-contacts/src/router.ts`, `src/pages/CustomersPage.tsx`, mount in `app/t/[tenant]/(modules)/crm/customers/page.tsx`

- Spostare `CustomersPage` nel modulo; sostituire `useAppStore` con `trpc.crm.contact.list.useQuery()`.
- Procedure: `crm.contact.list|create|update|delete`. Modal create/edit integrata con le mutation.

**Done when**: pagina Customers con DB reale; CRUD su Contact funzionante.

---

### T2.8 ✅ — Migrare Leads nel modulo crm-pipeline (nuovo)

**Deps**: ✅ T2.5, ✅ T2.6
**Size**: L
**Files**: `packages/modules/crm-pipeline/` (depends on crm-contacts)

- Modelli `Lead`, `Deal`, `PipelineStage` (sotto marker schema). Migrazione Kanban board.

**Done when**: `/t/<slug>/crm/leads` con DB reale; drag&drop persiste.

---

### T2.9 ✅ — Migrare Tasks nel modulo activities

**Deps**: ✅ T2.5
**Size**: M
**Files**: `packages/modules/activities/`

- Modello `Activity` (task|call|meeting|note); migrazione pagina tasks; procedure tRPC.

**Done when**: `/t/<slug>/tasks` (activities) con DB reale.

---

### T2.10 ✅ — Migrare Warehouse nel modulo warehouse

**Deps**: ✅ T2.5
**Size**: L
**Files**: `packages/modules/warehouse/`

- Modelli `Product`, `StockMovement`; migrazione inventory + movement history.

**Done when**: `/t/<slug>/warehouse` con DB reale.

---

### T2.11 ✅ — Event bus interno

**Deps**: ✅ T2.2
**Size**: M
**Files**: `packages/core/events/bus.ts`

- Event bus in-process (async-safe), `tenantEvent<Name, Payload>` con Zod; i moduli si iscrivono nel manifest. Esempio: `crm-pipeline` emette `lead.status.changed`.

**Done when**: event bus testato unit; ≥1 modulo emette + 1 si iscrive.

---

### T2.12 ✅ — Chiusura Fase 2 + navigazione dinamica

**Deps**: T2.7–T2.11
**Size**: S

- Sidebar con voci nav generate dai manifest (non hardcoded); smoke su tutte le pagine migrate. Marcare Fase 2 ✅.

---

# Fase 3 — Moduli MVP boutique

**Obiettivo**: portare i 5 moduli core MVP (`crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard`) a livello vendibile, **più il modulo `calendar`** (rientrato in MVP su decisione del 2026-06-13). Moduli a catalogo (quotes, it-anagrafica-check) e custom fields → DEFERRED (si costruiscono quando un cliente li paga).

**Branch di fase**: `feat/mvp-modules`

---

### T3.1 ✅ — crm-contacts: relazione Persona ↔ Azienda
**Deps**: T2.7 · **Size**: M — modello con relazione padre-figlio; UI dettaglio mostra persone dell'azienda.

### T3.2 ✅ — crm-contacts: tag e owner
**Deps**: T3.1 · **Size**: M — modello `Tag` (tenant-scoped) m2m con Contact; chip-input + filtro; owner = utente del tenant.

### T3.3 ✅ — crm-contacts: import CSV con mapping manuale
**Deps**: T3.2 · **Size**: L — upload CSV, mapping colonne→campi, preview 5 righe, import batch con progress.

### T3.4 ✅ — crm-contacts: export CSV
**Deps**: T3.2 · **Size**: S — export CSV filtrato.

### T3.5 ✅ — crm-contacts: soft delete con ripristino 30gg
**Deps**: T3.2 · **Size**: M — `deletedAt`, filtro default escluso, "Cestino" admin, job Inngest hard-delete dopo 30gg. (Allineato a GDPR mvp-scope §6.)

### T3.6 ✅ — crm-pipeline: stadi configurabili dal tenant
**Deps**: T2.8 · **Size**: M — `PipelineStage` ordinato; UI settings riordina/rinomina; 6 stadi default al setup tenant.

### T3.7 ✅ — crm-pipeline: conversione Lead → Deal e Deal Won → Customer
**Deps**: T3.6 · **Size**: M — pulsante "Convert to Deal"; Deal in "Won" marca Contact come customer.

### T3.8 ✅ — crm-pipeline: vista tabella alternativa al Kanban
**Deps**: T2.8 · **Size**: M — toggle Kanban/Table; tabella sortable, filtrabile, paginata.

### T3.9 ✅ — activities: timeline cross-modulo su contatto/deal
**Deps**: T2.9, T2.8 · **Size**: L — componente Timeline (dettaglio contatto e deal): activities + cambi stadio in ordine cronologico.

### T3.10 ✅ — activities: promemoria (notifiche in-app)
**Deps**: T2.9 · **Size**: M — job Inngest orario scansiona `dueDate`; crea **notifica in-app** per task in scadenza. *(La variante email resta `⏭` finché Resend non è attivo.)* Introduce il modello `Notification` (recipient/type/message/link/readAt, dedup) consumato poi dalla UI campanella in T3.23.

### T3.11 ✅ — Modulo calendar (nuovo): vista mese + settimana
**Deps**: T2.9 · **Size**: L · **Files**: `packages/modules/calendar/` + `apps/web/.../(modules)/calendar/` — modulo calendar (dep on activities); vista **mese** + **settimana** (custom, date-fns + shadcn, niente librerie esterne); eventi = activities con `dueDate` (chip colorate per tipo); click evento → modal dettaglio (stato/elimina). Rientrato in MVP il 2026-06-13.

### T3.12 ✅ — calendar: creazione evento dal calendario
**Deps**: T3.11 · **Size**: M — click su slot/giorno vuoto → modal nuova activity pre-compilata con la data (default Riunione; scadenza alle 09:00 del giorno).

### T3.13 ✅ — Modulo dashboard MVP
**Deps**: T2.8, T2.7, T2.9 · **Size**: L · **Files**: `packages/modules/dashboard/` + `packages/api/.../dashboard.ts` + `apps/web/.../dashboard/` — 6 widget fissi (pipeline aperta, vinti nel periodo, lead attivi, task in scadenza, nuovi contatti nel periodo, valore magazzino), filtri periodo+owner (`dashboard.stats`), numeri cliccabili → drill-down al modulo. Voce nav spostata da `CORE_NAV` al manifest del modulo.

### T3.14 ✅ — warehouse: alert stock sotto soglia
**Deps**: T2.10 · **Size**: S — soglia per-prodotto `lowStockThreshold` (default 5, editabile nel modal); badge "sotto soglia"/"esaurito" sulle righe inventario; banner dashboard con count (`dashboard.stats.lowStock`).

### T3.15 ✅ — warehouse: import CSV prodotti
**Deps**: T2.10 · **Size**: M — upload CSV + mapping colonne + preview 5 righe + import batch (`warehouse.product.importBatch`, `skipDuplicates` per SKU già presente). Mirror di T3.3.

### T3.16 → ♻️ RIATTIVATO in T4.20 — Modulo quotes (preventivi)
Non più deferred: il cliente metalmeccanico (su commessa) lo richiede → costruito in **Fase 4.5, T4.20**. Spec di dettaglio lì + archivio.

### T3.17 → ♻️ RIATTIVATO in T4.21 — quotes: generazione PDF brandato
Riattivato in **Fase 4.5, T4.21** (dipende da T4.20).

### T3.18 ⏭ DEFERRED — quotes: invio email + tracking stato
Dipende da Resend (deferred). Il PDF si scarica/consegna a mano finché Resend non è attivo. Si riattiva con Resend.

### T3.19 ⏭ DEFERRED — Modulo it-anagrafica-check (P.IVA/CF)
Fuori scope MVP boutique: catalogo "quick win italiano", su richiesta (`mvp-scope.md` §11). Spec in archivio.

### T3.20 ⏭ DEFERRED — it-anagrafica-check: autocompletamento da P.IVA
Dipende da T3.19 (deferred).

### T3.21 ⏭ DEFERRED — Custom fields dinamici (5 tipi)
Fuori scope MVP boutique: niente campi configurabili runtime; se serve un campo, si aggiunge nel codice del modulo (`mvp-scope.md` §5). Si rivaluta se 2+ clienti lo chiedono.

### T3.22 ✅ — Search globale (Postgres tsvector)
**Deps**: T2.7, T2.8, T2.10 · **Size**: L — colonna `searchable tsvector` (config `simple`) via trigger BEFORE INSERT/UPDATE + indice GIN su Contact/Deal/Product; `search.global({ query })` (`websearch_to_tsquery`, RLS-scoped); header search bar funzionale con dropdown raggruppato e drill-down al modulo.

### T3.23 ✅ — Notifiche in-app (campanella + dropdown)
**Deps**: T2.12 · **Size**: M — modello `Notification` (già da T3.10); router `notifications` (list/unreadCount/markAsRead/markAllAsRead, recipient+RLS scoped); campanella header con badge unread (poll 60s) e dropdown; evento **deal won** → notifica fan-out ai membri (dedup); activity reminder già da T3.10. *(Solo in-app; niente email.)*

### T3.24 ✅ — Chiusura Fase 3 + acceptance review
**Deps**: tutti i T3.* attivi · **Size**: S — verifica codebase verde (typecheck database/core/api/web, test RLS 12/12 + core 22/22); smoke golden path su DB reale (contatto→lead→cambio stadio→conversione→deal Won) che esercita crm-contacts + crm-pipeline + timeline + notifiche + search: contatto→customer, 3 eventi timeline, notifica deal-won fan-out, contatto indicizzato. **Fase 3 ✅** (18/18 attivi, +6 deferred). *(Quotes/PDF restano deferred.)*

---

# Fase 4 — Admin tenant, team & provisioning white-glove

**Obiettivo**: rendere il prodotto gestibile in modello boutique e **monetizzabile sugli account**. Tre pilastri: (1) l'owner del tenant gestisce il proprio **team** creando altri account legati alla sua azienda; (2) **limite posti** (`maxSeats`, default 2 = owner + 1) — per averne di più il cliente paga *fuori dall'app* e tu sblocchi gli slot; (3) la tua **sezione super-admin** di piattaforma da cui crei tenant e aggiungi slot. **Niente Stripe/self-serve/trial** (fatturazione manuale via contratto). Tagliati branding (T4.8) e R2 (T4.12) — non necessari per vendere.

**Branch di fase**: `feat/tenant-admin`

---

### T4.1 ⏭ DEFERRED — Setup Stripe (prodotti/prezzi)
Fuori scope: boutique fattura a mano (`mvp-scope.md` §2/§5). Si riattiva se cambia il modello commerciale.

### T4.2 ⏭ DEFERRED — Modello Subscription
Dipende da Stripe (deferred).

### T4.3 ⏭ DEFERRED — Stripe Checkout
Dipende da Stripe (deferred).

### T4.4 ⏭ DEFERRED — Webhook Stripe + idempotenza
Dipende da Stripe (deferred).

### T4.5 ⏭ DEFERRED — Stripe Customer Portal
Dipende da Stripe (deferred).

### T4.6 ⏭ DEFERRED — Trial 14 giorni
Fuori scope: il cliente firma un contratto, niente trial (`mvp-scope.md` §5).

### T4.7 ⏭ DEFERRED — Onboarding wizard self-serve
Fuori scope: onboarding white-glove, niente signup pubblico (`mvp-scope.md` §3). Sostituito da **T4.17**.

### T4.8 ⏭ DEFERRED — Pagina tenant admin: dati azienda e branding
Fuori scope per la vendita ai primi due clienti (decisione 2026-06-13). I dati azienda fissi (P.IVA, CF, indirizzo) servono solo per i preventivi → si aggiungono lì (Fase 4.5, T4.20). Il branding (logo/colore) dipende dallo storage e dal theming (Fase 5, T5.3); l'upload logo passerà a **Vercel Blob** (T4.24), non R2. Si riattiva quando serve.

### T4.9 ✅ — Modulo Team: gestione account del tenant + limite posti (seat)
**Deps**: ✅ fondamenta (RBAC), T4.10 · **Size**: L · **Files**: `Tenant.maxSeats` (schema+migration, default 2) · `packages/core/src/auth/password.ts` (+export `./auth/password`) · `packages/api/.../team.ts` · `apps/web/.../settings/team/page.tsx`
- Schema: `Tenant.maxSeats Int @default(2)` (= owner + 1 collega).
- Router `team` (gated **owner+admin**, permesso es. `tenant:members:write`): `list` (membri con ruolo/email + `seatsUsed`/`maxSeats`), `createMember` (crea `User` + `Account` credential con **password temporanea** da consegnare + `Membership` col ruolo scelto; **blocca se `seatsUsed >= maxSeats`**), `updateRole`, `removeMember` (guardie: non rimuovere sé stessi né l'ultimo owner; la rimozione libera un posto).
- Niente invito email (Resend deferred): l'owner crea l'account e consegna la password.
- UI `/t/<slug>/settings/team`: lista membri, "Crea account" (disabilitato con messaggio di upsell a `maxSeats/maxSeats`), cambio ruolo, rimozione.

**Done when**: ✅ l'owner crea un 2° account e accede; al 3° tentativo è bloccato con messaggio "contattaci per aggiungere posti"; owner+admin gestiscono, member/viewer no. Verificato: smoke a livello dati (creazione in `withTenant`/RLS, password validata con `verifyPassword`, blocco al 3°, rimozione libera il posto, 0 residui) + typecheck/test verdi (RLS 12/12, core 22/22). *(Bonus: fix tipizzazione in `requirePermission` — non ri-spande `ctx`, preserva il narrowing della session.)*

### T4.10 ✅ — Pagina tenant admin: abilitazione moduli
**Deps**: T2.12 · **Size**: M — `Tenant.enabledModules` (default 6 core); router `tenant.modules.list/setEnabled` (gated `tenant:settings:write`); pagina `/t/<slug>/settings` con toggle per modulo + Salva (gating owner/admin via `useCan`); la sidebar filtra le voci per modulo abilitato (`router.refresh()` dopo il salvataggio). (Core del modello boutique.)

### T4.11 ⏭ DEFERRED — Billing overview
Dipende da Stripe (deferred).

### T4.12 ⏭ DEFERRED — Cloudflare R2 setup per file storage
Sostituito da **Vercel Blob** (più semplice, nativo Vercel, nessun account/servizio extra; quota gratuita sufficiente per 2 clienti). Lo storage file ora vive in **T4.24** (Fase 4.5), attivato solo quando servono gli allegati. R2 si rivaluta solo se i costi di egress dovessero contare (irrilevante a 2 clienti).

### T4.13 ⏭ DEFERRED — Knowledge base seed + componente
Fuori scope MVP boutique (`mvp-scope.md` §9). Si rivaluta a crescita clienti.

### T4.14 ⏭ DEFERRED — Status page (statuspage.io)
Non essenziale per il 1° cliente boutique (uptime best-effort, `mvp-scope.md` §6). Rinviato.

### T4.15 ✅ — GDPR: export dati tenant + privacy/terms pages
**Deps**: ✅ fondamenta · **Size**: M · **Files**: `packages/api/src/routers/gdpr.ts` (+ dep `jszip`) · `apps/web/src/app/(legal)/{privacy,terms,dpa}/page.tsx` + layout · `apps/web/src/components/cookie-banner.tsx` · settings page (bottone export) · middleware (bypass `/dpa`)
- `gdpr.exportData` (gated owner/admin): raccoglie i dati del tenant (contatti, lead, deal, attività, prodotti, movimenti, vendite, preventivi+righe, commesse, settings) RLS-scoped → **ZIP di CSV** (base64) scaricato dal client; esclude la colonna `searchable`.
- Pagine **`/privacy`, `/terms`, `/dpa`** (bozza IT minimale, con disclaimer "da revisionare con un legale"), linkate dalle impostazioni.
- **Cookie banner** (solo se analytics attivo, `useSyncExternalStore` per leggere il consenso senza setState-in-effect).

**Done when**: ✅ l'owner esporta i dati in ZIP; le pagine legali sono pubbliche (200) e linkate; cookie banner presente. Verificato: smoke export su tenant reale (zip valido, conteggi seed, `searchable` escluso); pagine `/privacy /terms /dpa` → 200; typecheck + lint + RLS 12/12 + core 22/22. *(Contenuti legali = bozza, da far revisionare; affinamento finale in T7.1.)*

### T4.16 ✅ — Chiusura Fase 4 + acceptance (provisioning + admin + team)
**Deps**: T4.9, T4.10, T4.15, T4.17, T4.18 · **Size**: S — acceptance: dalla **super-admin** crei un tenant → l'owner accede a `/t/<slug>`, configura i moduli, **crea un 2° account** dal modulo Team, è bloccato al 3° → tu **aggiungi uno slot** dalla super-admin → l'owner crea il 3°. *(Niente acquisto piano: Stripe deferred.)*
**Done when**: ✅ smoke acceptance consolidato verde end-to-end (super-admin guard, provisioning tenant+owner+credenziale, config moduli, 2° account ok @2/2, 3° **bloccato** @2/2, super-admin alza maxSeats→3, 3° creato @3/3, 0 residui). **Fase 4 ✅ (6/6 attivi)**.

> ✅ **Fase 4 completa**: team multi-utente + **posti a pagamento** sbloccabili dall'operatore, **super-admin** `/admin` (crea tenant, gestisce slot/moduli/stato), provisioning CLI, abilitazione moduli, GDPR (export + privacy/terms/dpa + cookie banner). Tagliati branding (T4.8) e R2 (T4.12 → Vercel Blob in T4.24).

### T4.17 ✅ — Tenant provisioning white-glove (CLI o pagina admin riservata) — *nuovo*
**Deps**: T4.10 · **Size**: M · **Files**: `packages/database/prisma/provision-tenant.ts` + script `db:provision`. CLI con flag (`--slug --name --email --owner [--password --plan --modules]`): crea `Tenant` (slug/nome/piano/`enabledModules`), `User` owner (`emailVerified`), `Account` credential (hash Better-Auth, password auto-generata se omessa), `Membership` owner, `TenantSetting` di default (timezone/locale/currency/dateFormat) e `PipelineStage` di default; stampa le credenziali da consegnare. Validazione input (slug/email/plan/moduli), abort su slug duplicato, riuso utente esistente per un secondo tenant.
**Done when**: ✅ da un comando si crea un tenant completo pronto all'uso (sostituisce il signup self-serve deferred; mvp-scope §3 + DoD §8). Verificato end-to-end sul DB locale: tenant+owner+credential (password validata con `verifyPassword`) + membership owner + 4 settings + 6 stage.

### T4.18 ✅ — Sezione super-admin di piattaforma (`/admin`) — *nuovo*
**Deps**: T4.17, T4.9 · **Size**: L · **Files**: `apps/web/src/app/admin/{layout,page}.tsx` (fuori da `/t/[tenant]`) · `packages/api/.../admin.ts` · `packages/api/src/trpc.ts` (`superAdminProcedure`) · `packages/core/src/auth/index.ts` (`isSuperAdmin`) · `packages/core/src/provisioning/` (logica condivisa con T4.17)
- Auth: allowlist email in env **`SUPER_ADMIN_EMAILS`** → `superAdminProcedure` (usa `prismaAdmin`, cross-tenant, bypassa RLS). Niente flag sul DB (non escalabile dall'app).
- Pagina `/admin` (solo per te, l'operatore): **elenco aziende** (nome, slug, piano, stato, **posti usati/`maxSeats`**, moduli); **crea tenant** (versione web del provisioning T4.17, riusa la logica); **modifica azienda**: imposta `maxSeats` (= "aggiungi slot dopo il pagamento ricevuto fuori app"), attiva/sospendi (`status`), abilita/disabilita moduli, cambia piano.
- L'app **non gestisce pagamenti**: tu ricevi il bonifico, poi alzi `maxSeats` a mano da qui.

**Done when**: ✅ da `/admin` (loggato con email in `SUPER_ADMIN_EMAILS`) crei un tenant e ne aumenti gli slot; un utente non-allowlist riceve 404/forbidden su `/admin`. Verificato: doppia guardia (layout server redirige a `/login` se non loggato — confermato 307 — e `notFound()` se non allowlist; `superAdminProcedure` lato API); smoke dati di `provisionTenant`/`update`/`isSuperAdmin` (password validata, settings/stage, alza maxSeats, slug duplicato rifiutato, 0 residui); typecheck + RLS 12/12 + core 22/22 verdi.

---

# Fase 4.5 — Moduli verticali primi clienti

**Obiettivo**: le feature di dominio che **chiudono la vendita** ai due primi clienti. (A) metalmeccanico su commessa → preventivi + commesse; (B) compra-rivende online → margini + ordini di vendita. Allegati (foto prodotti / disegni tecnici) trasversali via Vercel Blob. Riattiva/estende i moduli `quotes`/`orders`/`production` del catalogo (`modules-catalog.md`).

**Branch di fase**: `feat/vertical-modules`

> Esecuzione: **dopo** la Fase 4 (team+admin), prima della Fase 5. Le 4 feature sono state confermate tutte dall'utente il 2026-06-13; l'ordine sotto è una proposta (preventivi e margini sono i due pezzi che spostano l'ago).

---

### T4.20 ✅ — Modulo quotes (preventivi/offerte) + dati azienda emittente
**Deps**: T2.7 (contatti) · **Size**: L · **Files**: `packages/modules/quotes/` + `packages/api/src/routers/quotes.ts` + schema `Quote`/`QuoteLine` (+ migration RLS) + `apps/web/.../(modules)/quotes/{page,[id]/page}.tsx`
- Modelli `Quote` (numero progressivo per tenant, contatto+snapshot nome, data, validità, stato, totali salvati) + `QuoteLine` (descrizione, quantità, prezzo, sconto%, IVA%, posizione). RLS su entrambe.
- Router `quotes` (tenantProcedure): list/get/create/update (sostituzione righe + ricalcolo)/updateStatus/delete; `companyInfo.get/set` (dati emittente come `TenantSetting`, set gated owner/admin) — qui rientra il pezzo "dati azienda" tagliato da T4.8.
- Stati: bozza → inviato → accettato → rifiutato → scaduto.
- UI: lista preventivi (numero/cliente/data/stato/totale) + editor righe con totali live (imponibile, IVA, totale) e selettore contatto/cliente libero. Aggiunto al `MODULE_CATALOG` (abilitabile per tenant); nav `Preventivi` (sezione operations).

**Done when**: ✅ il metalmeccanico crea un preventivo a righe per un cliente, con totali e IVA corretti, e lo porta in stato "inviato/accettato". Verificato: smoke dati (totali 1000/220/1220, numerazione progressiva, update righe+ricalcolo, stati, companyInfo, delete con cascade righe, 0 residui); typecheck full + RLS 12/12 + core 22/22 verdi. *(PDF = T4.21.)*

### T4.21 ✅ — quotes: export PDF brandato
**Deps**: T4.20 · **Size**: M · **Files**: `apps/web/src/lib/quote-pdf.tsx` + bottone "Scarica PDF" nell'editor. PDF del preventivo brandato (dati azienda emittente + righe + totali + IVA + cliente + date + note) generato con **`@react-pdf/renderer`** lato browser, scaricato come `preventivo-<n>.pdf`. Il modulo PDF è caricato **on-demand** (dynamic import al click) per non pesare sul bundle iniziale.
**Done when**: ✅ da un preventivo salvato si scarica un PDF leggibile e brandato. Verificato: render Node→buffer valido (`%PDF-`, 3205 byte) + typecheck/lint verdi. *(Logo = quando ci sarà lo storage T4.24; invio email resta `⏭` finché Resend non è attivo — vedi T3.18.)*

### T4.22 ✅ — Margini + Ordini di vendita (warehouse) — *cliente B*
**Deps**: T2.10 (warehouse) · **Size**: L · **Files**: schema `Product.costPrice` + model `Sale` + enum `SalesChannel` (+ migration RLS) · `packages/api/.../warehouse.ts` (sub-router `sales`) · `apps/web/.../warehouse/{page,sale-modal,product-modal}.tsx`
- Prodotto: prezzo di **acquisto** (`costPrice`) accanto al prezzo di vendita → **margine** per articolo.
- `warehouse.sales.record`: prodotto, quantità, **canale** (eBay/Amazon/Vinted/Subito/Negozio/Altro), prezzo, acquirente opz. → snapshot del costo, **movimento `out` + scarico stock** automatico, atomico. `sales.delete` storna (movimento `in` + ripristino stock).
- `sales.report`: ricavi/profitto/pezzi totali + margine per canale + top prodotti per profitto.
- UI: tab **Vendite** nel magazzino (summary margini + lista + "Registra vendita"); costo nel modale prodotto.

**Done when**: ✅ il rivenditore registra una vendita, lo stock cala da solo e vede il profitto (vendita − costo) per prodotto e nel periodo. Verificato: smoke dati (vendita 3pz → stock 10→7, snapshot costo invariato dopo cambio prodotto, profitto 60, movimento out, storno → stock 10), typecheck full + RLS 12/12 + core 22/22.

### T4.23 ✅ — Commesse / Ordini di lavoro (produzione) — *cliente A*
**Deps**: T2.7, T4.20 · **Size**: L · **Files**: `packages/modules/work-orders/` + schema `WorkOrder`/`WorkOrderStatus` (+ migration RLS) + `packages/api/.../work-orders.ts` + `apps/web/.../(modules)/work-orders/page.tsx`
- `WorkOrder`: numero progressivo, titolo/lavorazione, cliente (+snapshot), quantità opz., **scadenza** opz., stato (da fare → in lavorazione → completata → consegnata), note, `quoteId` opz. RLS.
- Router `workOrders` (list/create/update/updateStatus/delete). Aggiunto al `MODULE_CATALOG`; nav `Commesse` (operations).
- UI: **kanban per stato** (4 colonne) con cambio stato inline, evidenza commesse **in ritardo** (scadenza passata e non completata/consegnata), modale create/edit. **"Crea commessa"** dal preventivo accettato (pre-compila cliente + `quoteId`).

**Done when**: ✅ il metalmeccanico apre una commessa da un preventivo accettato e la fa avanzare negli stati fino a "consegnata". Verificato: smoke dati (numerazione progressiva, avanzamento stati fino a delivered, link `quoteId` da preventivo accettato, update/delete, 0 residui); typecheck dei package toccati + RLS 12/12 + core 22/22. *(Nota: il `pnpm typecheck` full segnala `@coordinate/ui`/`config` per file di altri progetti fuori repo — ambientale, non legato a questa modifica.)*

### T4.24 ✅ — File storage (Vercel Blob) + allegati — *trasversale*
**Deps**: ✅ fondamenta · **Size**: M · **Files**: `apps/web/src/app/api/upload/route.ts` + `apps/web/src/components/upload-button.tsx` + campi allegato sui moduli (`Product.imageUrl`, `WorkOrder.attachmentUrl/Name`, migration) · dep `@vercel/blob`
- Upload **client-upload** su **Vercel Blob** (store **public**, env `BLOB_READ_WRITE_TOKEN`): il browser carica diretto al Blob (niente limite 4.5MB delle function), la route `/api/upload` (`handleUpload`) controlla la **sessione** e limita tipi (img/PDF) + 25MB; l'URL pubblico è salvato sul modello.
- Allegati: **foto prodotto** (warehouse, cliente B — miniatura in inventario + modale) e **disegno tecnico/allegato** su commessa (cliente A — link nel modale). *(Lo store dev'essere public: gli URL salvati nel DB devono essere pubblici e durevoli.)*

**Done when**: ✅ si carica una foto su un prodotto / un allegato su una commessa, l'URL persiste e il file resta accessibile dopo un redeploy. Verificato: smoke Vercel Blob reale (put → fetch 200 → del → 404, host `*.public.blob.vercel-storage.com`); typecheck + lint + RLS 12/12 + core 22/22.

> ✅ **Fase 4.5 completa (5/5)**: preventivi+PDF, margini/ordini di vendita, commesse, allegati. I due primi clienti hanno il loro verticale.

---

# Fase 5 — Polish (theming, audit log, UX)

**Obiettivo**: UX al livello vendibile. **Solo italiano** (niente next-intl), formati IT, theming per tenant. Niente pricing/landing pubbliche SEO.

**Branch di fase**: `feat/polish`

---

### T5.1 ⏭ DEFERRED — next-intl + IT/EN
Fuori scope MVP boutique: solo italiano, stringhe hardcoded IT (`mvp-scope.md` §5/§6). Si attiva con un cliente non-italiano.

### T5.2 — Formati IT (date/numeri/valute) + timezone Europe/Rome
**Deps**: ✅ fondamenta · **Size**: S — `date-fns` con locale IT, `Intl.NumberFormat`/`Intl.DateTimeFormat`, fuso Europe/Rome di default. *(Senza framework i18n.)*

### T5.3 — Theming: colore tenant via CSS variables
**Deps**: T4.8 · **Size**: M — `<TenantThemeProvider>` inietta variabili; palette 50–900 via OKLCH dal colore primario; logo tenant in header.

### T5.4 — Audit log: visualizzazione admin
**Deps**: ✅ fondamenta (modello AuditLog) · **Size**: M — pagina admin con filtri (utente, periodo, azione); entry con diff JSON read-only.

### T5.5 — Empty states + loading skeletons
**Deps**: T3.24 · **Size**: M — empty state standard; skeleton per ogni tabella/lista.

### T5.6 — Mobile responsive review
**Deps**: T5.5 · **Size**: M — verifica 375px → desktop; fix tabelle overflow; menu hamburger.

### T5.7 — Branding: logo Coordinate, favicon, OG image
**Deps**: nessuna · **Size**: S — logo SVG, favicon set, OG image.

### T5.8 ⏭ DEFERRED — Pagina /pricing pubblica
Fuori scope: niente listino pubblico (`mvp-scope.md` §5).

### T5.9 — Landing minimale pubblica
**Deps**: nessuna · **Size**: M — sito statico minimale (chi siamo + contatto + CTA login). *(Versione ridotta: niente landing marketing SEO-ottimizzata né pricing teaser.)*

### T5.10 — Chiusura Fase 5 + UX review
**Deps**: tutti i T5.* attivi · **Size**: S — walkthrough come nuovo utente. Marcare Fase 5 ✅.

---

# Fase 6 — Testing & Hardening

**Obiettivo**: sicurezza e robustezza. E2E sui flussi boutique, security review, performance, backup.

**Branch di fase**: `feat/hardening`

---

### T6.1 — Setup Playwright + E2E login → sezione tenant
**Deps**: T5.10 · **Size**: M — Playwright in `apps/web`; test: login → `/t/<slug>/dashboard`. *(Signup è white-glove: il tenant è creato via T4.17, non self-serve.)*

### T6.2 — E2E: contatto + lead + deal
**Deps**: T6.1 · **Size**: M — golden path commerciale: contatto → lead → deal → Won. *(Niente preventivo: quotes deferred.)*

### T6.3 — E2E: warehouse + movimento stock
**Deps**: T6.1 · **Size**: S — golden path magazzino + alert sotto soglia.

### T6.4 ⏭ DEFERRED — E2E: it-anagrafica-check con mock VIES
Dipende da T3.19 (deferred).

### T6.5 — E2E cross-tenant isolation + membership
**Deps**: T6.1, T1.4 · **Size**: M — 2 tenant; accesso a dati/URL del tenant B da utente del tenant A → fallisce (`FORBIDDEN`/404). Copre RLS + il membership check di T1.4.

### T6.6 ✅ (parziale) — Security review checklist
**Deps**: T6.5 · **Size**: M — CSP/HSTS/X-Frame-Options; rate limiting su `/api/auth/*`; `pnpm audit`; verifica niente secret nel bundle. *(Turnstile su signup non applicabile: niente signup pubblico.)*
- ✅ **Security headers** in `apps/web/next.config.ts` (`headers()`): CSP (scoped su Sentry/PostHog/Vercel Blob + `'wasm-unsafe-eval'` per react-pdf), HSTS (solo prod), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Verificato 0 violazioni CSP su login/dashboard/magazzino/sicurezza/2FA in dev.
- ✅ **Rate limiting** auth in `packages/core/src/auth/index.ts` (`rateLimit` Better-Auth, regole strette su sign-in/2FA; attivo in prod, store in-memory per-istanza).
- ✅ **Niente segreti nel bundle client** (nessun file `"use client"` legge env server-only).
- ✅ **`pnpm audit` remediation** (branch `v2/chore/deps-audit-remediation`): da **56 vuln / 16 high → 11 vuln / 1 high**. Next 16.1.6→**16.2.9** (8 CVE, build prod verificato); rimossi `socket.io`/`socket.io-client` (inutilizzati → elimina il vuln `ws`); `pnpm.overrides` per le transitive (`undici ^6.27.0`, `@grpc/grpc-js ^1.14.4`, `protobufjs ^7.6.1`, `dompurify ^3.4.5`, `hono ^4.12.25`, `vite ^8.0.16`). L'unica high residua è `vite` (via `better-auth > vitest`, **solo tooling di test**, vuln del dev-server su Windows → non eseguito in produzione).
- *Nota: fatto in anticipo rispetto a Deps T6.5 (gli header/rate-limit non dipendono dagli E2E).*

> **Extra (non a piano)**: 2FA TOTP obbligatoria per Owner + rimozione OAuth/signup → branch `v2/feat/auth-2fa-mandatory-owner`, già in produzione. Theming per-tenant (T5.3) **rientra in MVP** (decisione 2026-06-22).

### T6.7 — Performance review
**Deps**: T6.5 · **Size**: M — Lighthouse ≥ 90 su landing/dashboard; chunk < 300KB gz; slow query log; indici mancanti.

### T6.8 — Backup verificato + runbook incident
**Deps**: T6.5 · **Size**: M — verifica backup Postgres prod; test restore in staging; `guides/runbook.md` (5 scenari).

### T6.9 — Chiusura Fase 6 + CI/CD
**Deps**: tutti i T6.* attivi · **Size**: M — GitHub Actions (lint/typecheck/test su PR); deploy Vercel su merge; `prisma migrate deploy` safe. Marcare Fase 6 ✅.

---

# Fase 7 — Launch white-glove

**Obiettivo**: il non-tecnico per partire col 1° cliente. Legal + supporto + go-live. **Niente** email transazionali / KB / video / marketing SEO nell'MVP (deferred).

**Branch di fase**: `feat/launch-prep`

---

### T7.1 — Privacy policy + Terms + DPA finalizzati
**Deps**: T6.9 · **Size**: L — revisione legale; pubblicazione `/privacy`, `/terms`, `/dpa`.

### T7.2 ⏭ DEFERRED — Email transazionali (Resend)
Fuori scope MVP boutique (`mvp-scope.md` §5). Si attiva con Resend.

### T7.3 ⏭ DEFERRED — Knowledge base (30 articoli)
Fuori scope MVP boutique (`mvp-scope.md` §9).

### T7.4 ⏭ DEFERRED — Video tutorial
Fuori scope MVP boutique (`mvp-scope.md` §9).

### T7.5 — Setup supporto: email (+ chat opzionale)
**Deps**: nessuna · **Size**: S — `support@coordinate.app`; pagina `/contact`; widget chat opzionale (Crisp free). (DoD §8: email supporto attiva.)

### T7.6 ⏭ DEFERRED — Marketing site + SEO
Fuori scope MVP boutique: sito minimale, niente SEO ottimizzato (`mvp-scope.md` §5).

### T7.7 — 1° cliente reale + contratto firmato
**Deps**: nessuna (parallelo all'intero progetto) · **Size**: L — identificare il 1° cliente, contratto + canone firmati, setup tenant + utenti, training iniziale. (DoD §8 commerciale.)

### T7.8 — Go-live + 30 giorni monitoring
**Deps**: T7.1, T7.5, T7.7 · **Size**: ongoing — DNS produzione; tenant pilota; monitoraggio Sentry + uptime; check supporto giornaliero; fine MVP a 30gg con 0 bug critici → ✅.

---

## Note di rollback

L'architettura a sottodominio e lo scope SaaS originale sono in `implementation-tasks.md` (archivio) e nei commit fino al pivot del 2026-05-30. Per tornare indietro: ripartire dal branch della vecchia architettura; lo stato globale di quel file indica il punto di arresto (Fase 2, ultimo completato T2.6). I task qui marcati `⏭ DEFERRED` mantengono lo spec completo nell'archivio.
