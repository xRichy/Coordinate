# Coordinate — Architettura Modulare Multi-Tenant

Documento di lavoro per definire l'architettura del prodotto. Le sezioni segnate con **[DECISIONE APERTA]** richiedono una scelta esplicita prima di iniziare l'implementazione.

## Decisioni già prese

- **Livello di personalizzazione: Tier 1-4 completo** — il prodotto deve supportare anche moduli custom scritti su misura per clienti specifici. Questo giustifica l'investimento iniziale in monorepo + module registry + cartella `tenants/`.
- **Scala iniziale incerta** — non ottimizziamo né per pochi né per molti clienti. Costruiamo un'architettura che funzioni con 1 cliente e regga fino a centinaia senza riscrivere niente. Niente premature optimization (es. Redis, code queue dedicate, Kubernetes).
- **Lingua del codice: inglese** — naming, commenti, messaggi di commit, documentazione tecnica interna in inglese. La documentazione di prodotto e i contenuti user-facing possono restare in italiano (gestiti via i18n). Questo documento `guides/` resta in italiano perché è documentazione di processo.

---

## 1. Visione del prodotto

Coordinate è un **CRM SaaS modulare** venduto a molti clienti diversi. Ogni cliente ha:

- un **set comune di funzionalità base** (CRM, task, magazzino, dashboard) — identiche per tutti
- un **profilo di configurazione** (quali moduli sono attivi, branding, custom fields, ruoli)
- opzionalmente, **moduli su misura** scritti per quel cliente soltanto

L'obiettivo architetturale: rendere possibile vendere lo stesso software a 10, 100 o 1000 clienti senza forkare il codice, ma poter consegnare anche soluzioni custom a chi paga di più.

---

## 2. Principi architetturali

| Principio | Cosa significa nel concreto |
|---|---|
| **Atomico** | Ogni modulo è un'unità autonoma con i suoi modelli, le sue rotte, i suoi permessi. Si può rimuovere senza rompere il resto. |
| **Agnostico** | Il core non sa cosa fa un modulo. Non c'è un `if (modulo === 'warehouse')` da nessuna parte. I moduli si registrano via manifest. |
| **Modulare** | Aggiungere un modulo = aggiungere un pacchetto al monorepo + registrarlo. Niente modifiche al core. |
| **Tenant-aware by default** | Ogni query, ogni cache, ogni evento porta con sé il `tenantId`. Niente accessi cross-tenant possibili. |
| **Type-safe end-to-end** | Dal DB al frontend, i tipi non si rompono mai. Prisma → tRPC → React. |

---

## 3. Strategia di multi-tenancy

### Opzioni

| Strategia | Isolamento | Costo | Quando ha senso |
|---|---|---|---|
| **A. Shared DB + `tenantId` colonna + RLS** | Logico | Bassissimo | Default per tutti i clienti SMB |
| **B. Shared DB + schema-per-tenant** | Medio | Medio | Mai, salvo casi rari |
| **C. DB dedicato per tenant** | Fisico | Alto | Clienti enterprise con compliance |

### Raccomandazione

**Partire con (A) + opzione di passare a (C) per i clienti enterprise**, senza riscrivere niente.

Come si fa concretamente:
- Ogni tabella ha una colonna `tenantId` indicizzata.
- Si abilita **Postgres Row-Level Security (RLS)** con una policy che filtra per `current_setting('app.tenant_id')`.
- A ogni richiesta HTTP, il middleware fa `SET LOCAL app.tenant_id = '<tenantId>'` sulla connessione Prisma.
- Risultato: **anche un bug applicativo non può leggere dati di un altro tenant**, perché Postgres lo blocca.

Per i tenant enterprise (C), si fa un deploy dedicato col loro `DATABASE_URL`. Il codice non cambia.

### [DECISIONE APERTA] Identificazione del tenant

Come capisce il backend chi è il tenant della richiesta?
- **Sottodominio** (`acme.coordinate.app`) → più professionale, richiede wildcard DNS + certificati wildcard
- **Path prefix** (`coordinate.app/t/acme`) → più semplice, meno carino
- **Header / JWT claim** → flessibile ma meno user-facing

Raccomandato: **sottodominio** per produzione, fallback su JWT claim nello sviluppo.

---

## 4. I quattro livelli di personalizzazione

Una cosa fondamentale da chiarire fin da subito: **non tutte le personalizzazioni vanno trattate allo stesso modo**. Ne identifichiamo quattro tier, con costo crescente:

### Tier 1 — Configurazione (zero codice)
- Abilitare/disabilitare moduli core
- Cambiare branding (logo, colori, nome)
- Configurare ruoli e permessi
- Tradurre etichette / pipeline di vendita
- Definire stati custom (es. gli stati dei lead)

**Implementazione**: tabella `TenantConfig` + UI di amministrazione. Nessun deploy.

### Tier 2 — Custom fields (zero codice, schema dinamico)
- Aggiungere campi alle entità core (es. "Codice IVA" sul cliente)
- Definire validazioni, tipi, obbligatorietà

**Implementazione**: colonna `customFields JSONB` su ogni entità core, con uno schema dichiarato in `TenantSchema` validato via Zod runtime. **NO al pattern EAV** (Entity-Attribute-Value): è un anti-pattern che rende le query un inferno.

### Tier 3 — Workflow e automazioni (low-code)
- "Quando un lead passa a 'Vinto', crea un cliente e una task per la fatturazione"
- "Ogni lunedì manda il report dei lead aperti al sales manager"

**Implementazione**: un workflow engine (vedi §11). Si può aggiungere dopo, non è bloccante per il v1.

### Tier 4 — Moduli custom (codice bespoke)
- Modulo dedicato per un cliente specifico (es. "Gestione flotta veicoli" per un cliente che fa logistica)

**Implementazione**: cartella `tenants/<slug>/modules/`, build pipeline che include il modulo solo per quel tenant. Vedi §7.

### Raccomandazione di priorità

```
v1: Tier 1 + (parzialmente) Tier 2
v2: Tier 2 completo
v3: Tier 3
v4: Tier 4
```

Ma **l'impalcatura per il Tier 4 va messa subito** (monorepo, manifest, registry), altrimenti rifare l'architettura dopo è devastante.

---

## 5. Stack tecnologico raccomandato

### Da tenere (già presente)
- **Next.js 16 + React 19 + TypeScript** — App Router
- **Tailwind 4 + Shadcn/UI** — sistema di design
- **Prisma + PostgreSQL** — ORM e DB
- **React Hook Form + Zod** — form e validazione
- **Recharts, Sonner, Framer Motion** — bene così

### Da aggiungere
| Categoria | Scelta | Perché |
|---|---|---|
| **Monorepo** | **Turborepo** + **pnpm workspaces** | Standard de facto per Next.js, semplice, veloce |
| **API layer** | **tRPC** | Type-safety end-to-end senza generare codice, perfetto per architettura modulare |
| **Auth** | **Better-Auth** (o NextAuth v5) | Better-Auth ha multi-tenancy nativo e organizzazioni |
| **State server** | **TanStack Query** (integrato in tRPC) | Sostituisce le chiamate dirette nello Zustand |
| **State client** | **Zustand** (mantenere) | Va benissimo per UI state |
| **Permissions** | **CASL** o RBAC custom | CASL gestisce permessi attributo-based, ottimo per multi-tenant |
| **Feature flags** | DB-based custom (poi eventualmente **Unleash** self-hosted) | I "moduli abilitati" sono già un feature flag |
| **Workflow engine** | **Inngest** o **Trigger.dev** | Background jobs + workflow durable, no Redis da gestire |
| **i18n** | **next-intl** | Standard per Next.js App Router |
| **Email** | **Resend** + **React Email** | DX migliore in circolazione |
| **File storage** | **S3-compatible** (Cloudflare R2 / Backblaze) | Costi bassi, multi-tenant via prefisso path |
| **Observability** | **Sentry** + **PostHog** | Errori + analytics prodotto |
| **Testing** | **Vitest** + **Playwright** | Unit + e2e |

### Da NON aggiungere (per ora)
- Microservizi — il modulare monolith è la scelta giusta per anni
- Redis dedicato — Postgres LISTEN/NOTIFY copre il 90% dei casi
- GraphQL — tRPC fa tutto quello che ti serve con meno complessità
- Kubernetes — Vercel / Railway / Fly.io vanno benissimo per i prossimi 100 clienti

---

## 6. Struttura del monorepo

```
coordinate/
├── apps/
│   └── web/                          # L'app Next.js
│       ├── src/app/                  # Solo routing e layout, niente logica
│       ├── src/server/               # Entry point tRPC + middleware tenant
│       └── ...
│
├── packages/
│   ├── core/                         # Cuore della piattaforma
│   │   ├── tenant/                   # Gestione tenant, RLS, middleware
│   │   ├── auth/                     # Wrapper su Better-Auth
│   │   ├── module-registry/          # Caricamento e registrazione moduli
│   │   ├── permissions/              # CASL ability builder
│   │   ├── custom-fields/            # Sistema custom fields
│   │   └── events/                   # Event bus interno (vedi §9)
│   │
│   ├── ui/                           # Componenti Shadcn condivisi
│   ├── database/                     # Prisma schema base + utility
│   ├── api/                          # Router tRPC root + procedure helpers
│   ├── config/                       # eslint, tsconfig, tailwind condivisi
│   │
│   └── modules/                      # MODULI CORE (uno per cartella)
│       ├── crm/                      # Customers + Leads
│       ├── tasks/
│       ├── warehouse/
│       ├── analytics/
│       └── notifications/
│
├── tenants/                          # MODULI CUSTOM per tenant specifici
│   ├── acme-corp/
│   │   ├── modules/
│   │   │   └── fleet-management/     # Modulo bespoke per Acme
│   │   └── tenant.config.ts
│   └── ...
│
├── guides/                           # Documentazione (questa cartella)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Regole sacre

1. **`apps/web` non importa direttamente da `packages/modules/*`**. Importa solo dal `module-registry`, che a sua volta carica i moduli abilitati per il tenant corrente.
2. **I moduli possono dipendere da `core`, `ui`, `database`, `api`. NON tra di loro direttamente.** Se due moduli devono comunicare, lo fanno via eventi (vedi §9).
3. **`tenants/<slug>/` è opzionale**. Un tenant senza cartella custom funziona perfettamente con i soli moduli core.
4. Niente `index.ts` di barrel re-export a livello di package se non strettamente necessario — rovinano il tree-shaking.

---

## 7. Sistema di moduli — il cuore dell'architettura

Ogni modulo (sia core sia custom) esporta un **manifest** che dichiara tutto ciò che il modulo fornisce. Il `module-registry` legge i manifest e configura l'app di conseguenza.

### Anatomia di un manifest (descrizione, non codice)

Un manifest di modulo dichiara:

- **`id`** — identificatore univoco (es. `crm`, `warehouse`, `acme.fleet`)
- **`version`** — semver del modulo
- **`displayName`** — nome user-facing (i18n key)
- **`dependsOn`** — altri moduli richiesti (es. `fleet` dipende da `crm`)
- **`routes`** — array di rotte App Router con `path`, `component`, `permissions`
- **`navigation`** — voci di menu da iniettare nella sidebar (con icona, label, sezione)
- **`permissions`** — permessi che il modulo introduce (es. `warehouse:product:write`)
- **`prismaSchema`** — frammento Prisma con i modelli del modulo (uniti al boot)
- **`migrations`** — riferimento alla cartella migrazioni del modulo
- **`apiRouter`** — router tRPC esportato dal modulo
- **`eventHandlers`** — listener su eventi del bus (es. `lead.status.changed` → crea task)
- **`customFieldsExtensions`** — entità del modulo che accettano custom fields
- **`settingsPage`** — componente per la pagina di configurazione del modulo

### Come si registra un modulo

1. Al boot dell'app, il `module-registry` enumera tutti i moduli installati (core + tenant-specific).
2. Per ogni richiesta HTTP, dato il tenant, filtra i moduli abilitati nella `TenantConfig`.
3. Espone:
   - un **router tRPC dinamico** che monta solo i sub-router dei moduli abilitati
   - una **funzione `getNavigation(user)`** che ritorna le voci di menu filtrate per permessi
   - una **funzione `resolveRoute(path)`** che ritorna il componente da renderizzare

### Caricamento frontend

App Router non supporta nativamente le rotte dinamiche da moduli. Due approcci:

- **(a) Catch-all route + dispatcher**: una rotta `app/[...slug]/page.tsx` che chiede al registry di risolvere il componente. Più dinamico, ma perdi alcuni vantaggi di Next (es. layout statici per rotta).
- **(b) Generazione build-time**: uno script `prebuild` genera le cartelle `app/(modules)/*` dai manifest dei moduli abilitati nel build. Più "Next-native", ma il set di moduli per build deve essere noto in anticipo.

**[DECISIONE APERTA]** Tra (a) e (b). Raccomando **(b)** per il MVP (un build per profilo standard) e valutare (a) solo se serve abilitazione moduli a caldo.

### Trade-off da capire bene

Il "module registry" puro è elegante ma **complica il debugging**: stack trace meno chiare, errori in fase di registrazione difficili da diagnosticare. Per questo motivo:
- Il sistema deve avere **error boundaries per modulo** (un modulo che esplode non deve far cadere tutta l'app).
- Ci deve essere una **pagina di diagnostica** in admin che mostra lo stato di registrazione di ogni modulo.

---

## 8. Custom fields ed estensione di entità

### Modello dati

Ogni entità core estendibile ha:
- una colonna `customFields JSONB NOT NULL DEFAULT '{}'`
- un riferimento allo schema custom per il tenant + entità in `TenantCustomFieldSchema`

Lo schema definisce, per ogni campo:
- nome, label (i18n), tipo (string, number, date, enum, reference, …)
- validazioni (required, min, max, regex)
- visibilità (in form, in tabella, in dettaglio)
- ordine di visualizzazione

### Validazione

Al boot, per ogni tenant si compila uno **Zod schema** dai `TenantCustomFieldSchema`. Le mutation tRPC validano il payload `customFields` contro lo schema compilato.

### Rendering

I componenti `<EntityForm>` e `<EntityTable>` sono **dichiarativi**: ricevono lo schema (campi core + campi custom) e generano UI di conseguenza. Niente JSX hard-coded per ogni entità.

### Query

Postgres permette di indicizzare e interrogare JSONB. Per i campi su cui si filtra spesso, si crea un indice `GIN` o `BTREE` espressione. **Limite**: non si possono fare JOIN su custom fields. Se un cliente ne ha bisogno, è Tier 4 (modulo custom).

---

## 9. Eventi e comunicazione tra moduli

I moduli **non si chiamano direttamente**. Comunicano via event bus interno.

- Quando il modulo `crm` cambia lo stato di un lead a "Won", emette `lead.status.changed` sul bus.
- Il modulo `tasks` (se abilitato) può iscriversi all'evento e creare automaticamente una task di follow-up.
- Il modulo `notifications` può emettere una notifica.

### Implementazione

- **In-process (default)**: un emitter sincrono, gli handler girano nello stesso request (transazione condivisa). Semplice, no infrastruttura.
- **Async (per workflow lunghi)**: si pubblica su **Inngest** / **Trigger.dev**, che garantiscono retry, idempotenza, durabilità.

Ogni evento ha:
- un nome (`<module>.<entity>.<action>`)
- un payload tipizzato (Zod schema esportato dal modulo emittente)
- il `tenantId`, il `userId`, il `timestamp`

I moduli dichiarano gli eventi che emettono e quelli che ascoltano nel manifest.

---

## 10. Autenticazione, ruoli e permessi

### Auth

- **Better-Auth** gestisce login, sessioni, MFA, password reset.
- Estensione **organizations** di Better-Auth = i nostri tenant.
- Un utente può appartenere a più organizzazioni (utile per consulenti / partner).
- Provider OAuth (Google, Microsoft) configurabili per tenant (alcuni enterprise lo richiedono).

### Modello di permessi

Tre livelli:
1. **Ruoli predefiniti**: `owner`, `admin`, `member`, `viewer` — per ogni tenant.
2. **Permessi granulari**: ogni modulo dichiara permessi atomici (es. `crm:lead:read`, `warehouse:product:delete`).
3. **Attributi**: un utente può vedere solo i lead di cui è owner — gestito con **CASL** che supporta condizioni runtime.

### Enforcement

- A livello tRPC: middleware `requirePermission('crm:lead:write')` su ogni procedure.
- A livello UI: hook `useCan('crm:lead:write')` per nascondere/disabilitare bottoni.
- A livello DB: RLS Postgres come ultima difesa.

---

## 11. Workflow engine (Tier 3)

Quando arriviamo al Tier 3, due opzioni:

| Approccio | Pro | Contro |
|---|---|---|
| **Visual builder custom** (tipo n8n / Zapier interno) | UX top per clienti non-tech | Mesi di sviluppo |
| **Codice + UI di trigger config** | Settimane di sviluppo | Solo per power user |

Per il MVP del Tier 3, raccomando: **Inngest** per l'esecuzione + una semplice UI per definire trigger condizionali (es. "quando lead.status diventa X, fai Y"). Si scala al visual builder dopo.

---

## 12. Theming e branding per tenant

- CSS variables già in uso → ogni tenant ha un set di colori salvati in `TenantConfig.theme`.
- Al boot, un componente injecta le variables nel `<html>`.
- Logo e favicon serviti da S3 con path `tenants/<slug>/branding/`.
- Font: lasciare il default, dare opzione di sovrascrivere con Google Fonts whitelisted (no font custom uploadati = no problemi licenze).

---

## 13. Internazionalizzazione

- **next-intl** per le stringhe statiche del core e dei moduli.
- Ogni modulo porta i propri file di traduzione (`packages/modules/<mod>/locales/*.json`).
- Il `module-registry` li merge a runtime.
- I custom fields hanno label tradotti (lo schema accetta `label: { it: '...', en: '...' }`).
- **Lingue v1**: italiano + inglese. Aggiungere altre è banale.

---

## 14. Strategia di deploy

### Default (90% dei clienti)
- Un singolo deploy multi-tenant su **Vercel** (frontend) + **Railway / Neon** (Postgres).
- Tutti i tenant condividono lo stesso `web` e lo stesso DB, isolati via RLS.
- Costo marginale per tenant ≈ zero.

### Enterprise (clienti con requisiti di isolamento)
- Stesso codice, deploy dedicato in un account / progetto separato.
- DB dedicato.
- Eventualmente regione specifica (es. EU per GDPR strict).

### Custom modules (Tier 4)
- I moduli custom finiscono nello stesso bundle del deploy del cliente.
- Per il deploy multi-tenant: un build per "profilo" (es. `standard`, `acme`). I tenant `acme-*` vengono routati al deploy `acme`.
- Si può anche fare un single build con tutti i moduli e attivarli per tenant, ma il bundle cresce → meglio profili separati appena ci sono >2 moduli custom grossi.

### CI/CD
- **GitHub Actions** per test + build + deploy.
- Branch `main` → staging, tag `v*` → produzione.
- Migration Prisma applicate automaticamente con `prisma migrate deploy`.
- Rollback: revert deploy su Vercel (frontend) + `prisma migrate resolve` per il DB.

---

## 15. Roadmap di migrazione dallo stato attuale

Lo stato attuale: Next.js singolo app, Zustand con mock data, nessun backend. Per arrivare all'architettura target, in ordine:

### Fase 0 — Setup monorepo (1-2 giorni)
- Convertire il repo in monorepo con pnpm workspaces + Turborepo.
- Spostare l'attuale codice in `apps/web`.
- Creare `packages/ui` con i componenti Shadcn.
- Tutto deve continuare a funzionare identico, solo riorganizzato.

### Fase 1 — Backend e auth (1 settimana)
- Aggiungere tRPC con un router base.
- Integrare Better-Auth con organizzazioni.
- Implementare middleware tenant + RLS Postgres.
- Spostare lo Zustand a TanStack Query (lo Zustand resta solo per UI state).

### Fase 2 — Estrazione moduli core (1-2 settimane)
- Spostare `crm`, `tasks`, `warehouse` in `packages/modules/*`.
- Implementare il `module-registry` (versione minimale: i moduli sono noti a build-time).
- Spostare i modelli da mock data a Prisma + DB reale.
- Generare le rotte App Router dai manifest (approccio (b) del §7).

### Fase 3 — Custom fields + tenant config (1 settimana)
- UI di amministrazione tenant (abilita/disabilita moduli, branding, ruoli).
- Sistema custom fields (schema + form/table dinamici).
- Theming per tenant.

### Fase 4 — Primi clienti reali
- Onboarding, billing (Stripe), email transazionali.
- Observability (Sentry + PostHog).
- Documentazione utente.

### Fase 5 (post-MVP) — Workflow engine + moduli custom
- Inngest + UI di automation base.
- Pipeline per moduli custom per-tenant.

---

## 16. Decisioni aperte (da chiudere prima di iniziare)

| # | Decisione | Opzioni | Mia raccomandazione |
|---|---|---|---|
| ~~D1~~ | ~~Identificazione tenant~~ | ~~Sottodominio / Path / Header~~ | ✅ **Chiusa: sottodominio** (`*.coordinate.app`, in dev `lvh.me`) |
| ~~D2~~ | ~~Caricamento rotte moduli~~ | ~~Catch-all dispatcher / Generazione build-time~~ | ✅ **Chiusa: build-time** (prebuild script genera `app/(modules)/*` dai manifest) |
| D3 | API layer | tRPC / REST / GraphQL | **tRPC** |
| ~~D4~~ | ~~Auth provider~~ | ~~Better-Auth / NextAuth / Clerk~~ | ✅ **Chiusa: Better-Auth** (organizzazioni native, self-hosted, zero canone) |
| D5 | Background jobs | Inngest / Trigger.dev / BullMQ | **Inngest** (gratis fino a soglia generosa) |
| ~~D6~~ | ~~Hosting~~ | ~~Vercel / Railway / Fly.io / self-host~~ | ✅ **Chiusa: Vercel + Neon** per v1 |
| D7 | Billing | Stripe / Paddle / Lemon Squeezy | **Stripe** (più potente, gestisce tasse EU) |
| D8 | Strategia custom fields | JSONB / EAV / tabelle dinamiche | **JSONB** (no discussioni) |
| D9 | Modello prezzi | Per seat / Per modulo / Tier flat | ✅ **Chiusa: Tier + add-on** + 3 modelli commerciali (SaaS/Lifetime/On-premise) — vedi `pricing.md` |
| ~~D10~~ | ~~Lingua del codice e dei commenti~~ | ~~Italiano / Inglese~~ | ✅ **Chiusa: inglese** |

---

## 17. Cosa NON fare

- **Non microservizi**. Il modulare monolith con manifest è infinitamente più semplice e copre i tuoi prossimi 5 anni.
- **Non Kubernetes**. Vercel / Railway risolvono tutto fino a centinaia di tenant.
- **Non EAV per i custom fields**. È un anti-pattern noto, le query diventano illeggibili e lente.
- **Non condividere componenti UI tra moduli importandoli da `packages/modules/altro-modulo`**. Tutto ciò che è condiviso vive in `packages/ui` o `packages/core`.
- **Non fare un "modulo plugin loader" iperflessibile prima di averne bisogno**. Manifest + registry semplice basta per molto tempo.
- **Non permettere ai moduli custom di modificare il core**. Possono solo estendere via hook/eventi/custom fields. Altrimenti perdi la possibilità di upgrade.

---

## Glossario

- **Tenant** = un cliente / azienda che usa il software. Sinonimo di "organizzazione".
- **Modulo** = un'unità funzionale autonoma (CRM, Warehouse, …) con manifest, router, modelli.
- **Manifest** = file di metadati che descrive cosa fornisce un modulo.
- **Module registry** = componente del core che enumera, valida e attiva i moduli.
- **RLS** = Row-Level Security, meccanismo Postgres di filtraggio righe a livello DB.
- **Tier 1-4** = livelli di personalizzazione disponibili (config, custom fields, workflow, codice).
