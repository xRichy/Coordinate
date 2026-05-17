# Coordinate — Architettura Modulare Multi-Tenant

Documento di lavoro che descrive l'architettura del prodotto. Le sezioni segnate con **[DECISIONE APERTA]** richiedono una scelta esplicita prima di implementare quella parte.

## Decisioni già prese

- **Modello di business: boutique platform**. ~5 clienti totali al massimo, ciascuno con un mix di moduli core + moduli custom. Niente SaaS aperto, niente self-serve. Tutto white-glove. Vedi `mvp-scope.md` per il dettaglio.
- **Modello commerciale: canone annuale + setup fee** per moduli custom. Niente Stripe nell'MVP. Fatturazione manuale.
- **Lingua del codice: inglese**. Naming, commenti, messaggi di commit, documentazione tecnica interna in inglese. La UI è in italiano. Questo documento resta in italiano perché è documentazione di processo.
- **Lingua del prodotto: italiano**. Niente i18n nell'MVP. Stringhe hardcoded.

---

## 1. Visione del prodotto

Coordinate è una **piattaforma modulare multi-tenant** venduta a un numero ristretto di clienti (target: ~5). Ogni cliente ha:

- un **set di moduli core** scelti da te al setup (CRM, magazzino, attività, dashboard, ecc.)
- un **profilo di configurazione** (branding, ruoli, dati azienda)
- opzionalmente, **uno o più moduli custom** scritti su misura per lui, pagati con setup fee

L'obiettivo architetturale: **far convivere clienti con set di moduli diversi nello stesso codebase e nello stesso deploy**, senza forkare il codice e senza UI a runtime per scegliere i moduli. Tu decidi quali moduli sono abilitati per quale tenant nella `TenantConfig`.

---

## 2. Principi architetturali

| Principio | Cosa significa nel concreto |
|---|---|
| **Atomico** | Ogni modulo è un'unità autonoma con i suoi modelli, le sue rotte, i suoi permessi. Si può rimuovere senza rompere il resto. |
| **Agnostico** | Il core non sa cosa fa un modulo. Non c'è un `if (modulo === 'warehouse')` da nessuna parte. I moduli si registrano via manifest. |
| **Modulare** | Aggiungere un modulo = aggiungere un package al monorepo + registrarlo. Niente modifiche al core. |
| **Tenant-aware by default** | Ogni query, ogni cache, ogni evento porta con sé il `tenantId`. Niente accessi cross-tenant possibili. |
| **Type-safe end-to-end** | Dal DB al frontend, i tipi non si rompono mai. Prisma → tRPC → React. |
| **Semplicità prima della scala** | Niente premature optimization. Con 5 clienti totali non servono Redis, sharding, microservizi. |

---

## 3. Strategia di multi-tenancy

### Approccio scelto

**Shared DB + colonna `tenantId` + Postgres Row-Level Security (RLS)**.

Come si fa concretamente:
- Ogni tabella che contiene dati di tenant ha una colonna `tenantId` indicizzata.
- È abilitata **Postgres RLS** con policy che filtra per `current_setting('app.tenant_id')`.
- A ogni richiesta HTTP, il middleware fa `SET LOCAL app.tenant_id = '<tenantId>'` sulla connessione Prisma usando l'helper `withTenant()`.
- Risultato: **anche un bug applicativo non può leggere dati di un altro tenant**, perché Postgres lo blocca.

### Identificazione del tenant ✅ DECISIONE CHIUSA

Il backend identifica il tenant dal **sottodominio** (`acme.coordinate.app`). In dev usiamo `*.lvh.me:3000`. Path speciali (`/`, `/login`, `/signup`, `/api/auth/*`) non richiedono sottodominio.

### Possibili evoluzioni future

Se un cliente enterprise richiedesse isolamento fisico forte (compliance, sovranità dato), si può fare un deploy dedicato con `DATABASE_URL` separato senza cambiare codice. Non è all'orizzonte oggi.

---

## 4. Personalizzazione per cliente

Con il modello boutique a ~5 clienti, **non c'è più una distinzione rigida tra "tier di personalizzazione"**. Ogni cliente ha:

1. **Configurazione tenant** — quali moduli sono attivi, branding, ruoli, dati azienda
2. **Moduli che usa** — un mix di moduli core (condivisi con altri clienti) e moduli custom (solo suoi)

### Modulo "core" vs modulo "custom": stessa architettura

La differenza è solo **chi lo usa**:
- **Modulo core**: vive in `packages/modules/<id>/`, lo abilitano molti clienti via `TenantConfig.enabledModules`
- **Modulo custom**: vive in `packages/modules/<id>/`, lo abilita un solo cliente via `TenantConfig.enabledModules`

Stesso manifest. Stesso build. Stesso deploy. Nessuna cartella `tenants/<slug>/modules/` speciale, nessun build profile separato.

Esempi:
- `crm-contacts` → modulo core, attivo per tutti i clienti
- `acme-fleet` → modulo custom per Acme: solo `acme.coordinate.app` lo vede

Quando un modulo custom diventa interessante per più clienti, lo "promuovi" rinominandolo e aggiungendolo al catalogo standard. Nessuna migrazione tecnica necessaria.

### Cosa NON c'è nell'MVP

- ❌ **Custom fields dinamici a runtime** (Tier 2 del piano vecchio): se un cliente vuole aggiungere il campo "Codice IBAN" al Contatto, lo aggiungiamo nel codice del modulo. Con 5 clienti è più rapido che costruire un sistema di schema dinamico.
- ❌ **Workflow engine visuale** (Tier 3 del piano vecchio): se un cliente chiede automazioni, le scrivi come moduli custom o come job Inngest. Niente UI di automation.

---

## 5. Stack tecnologico

### Confermato (presente o in piano)

| Categoria | Scelta | Note |
|---|---|---|
| Framework | **Next.js 16** (App Router) | React 19, TypeScript |
| UI | **Tailwind 4 + Shadcn/UI** | New York style, CSS variables |
| Monorepo | **Turborepo + pnpm workspaces** | Standard de facto |
| API layer | **tRPC** | Type-safety end-to-end |
| Auth | **Better-Auth** | Plugin `organizations` = tenants |
| ORM | **Prisma + PostgreSQL** | RLS attivo |
| Server state | **TanStack Query** (via tRPC) | |
| Client state | **Zustand** | Solo UI state |
| Form | **React Hook Form + Zod** | |
| Background jobs | **Inngest** | Job di cleanup, soft-delete |
| File storage | **Cloudflare R2** | S3-compatible |
| Observability | **Sentry** | Errors. PostHog opzionale per analytics interna |

### Deferred all'MVP (si aggiungono se/quando serve)

| Categoria | Stato | Si attiva quando |
|---|---|---|
| **Stripe** | Deferred | Se il modello commerciale cambia (improbabile a 5 clienti) |
| **Resend** (email transazionali) | Deferred | Se servono email di invito utente, password reset stylizzato, alert |
| **next-intl** (i18n) | Deferred | Se arriva un cliente non-italiano |
| **CASL** (permessi attributo-based) | Deferred | RBAC ruolo-based attuale basta finché nessuno chiede "vedi solo i tuoi lead" |

### Da NON aggiungere

- Microservizi — il modular monolith è la scelta giusta per anni
- Redis dedicato — Postgres LISTEN/NOTIFY copre il 99% dei casi
- GraphQL — tRPC fa tutto con meno complessità
- Kubernetes — Vercel + Neon vanno benissimo

---

## 6. Struttura del monorepo

```
coordinate/
├── apps/
│   └── web/                          # L'app Next.js
│       ├── src/app/                  # Routing e layout
│       ├── src/server/               # Entry tRPC + middleware tenant
│       └── ...
│
├── packages/
│   ├── core/                         # Cuore della piattaforma
│   │   ├── auth/                     # Wrapper su Better-Auth
│   │   ├── tenant/                   # Gestione tenant, RLS, middleware
│   │   ├── module-registry/          # Caricamento e registrazione moduli ✅
│   │   ├── permissions/              # RBAC
│   │   ├── analytics/                # PostHog (opzionale, no-op se disattivato)
│   │   └── jobs/                     # Inngest client
│   │
│   ├── ui/                           # Componenti Shadcn condivisi
│   ├── database/                     # Prisma schema + utility (es. withTenant)
│   ├── api/                          # tRPC router root + procedure helpers
│   ├── config/                       # tsconfig condiviso
│   │
│   └── modules/                      # TUTTI i moduli, core e custom
│       ├── crm-contacts/
│       ├── crm-pipeline/
│       ├── activities/
│       ├── warehouse/
│       ├── dashboard/
│       └── acme-fleet/               # esempio modulo custom per Acme
│
├── guides/                           # Documentazione (questa cartella)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Niente cartella `tenants/`**: i moduli custom vivono accanto a quelli core, in `packages/modules/`. La distinzione è puramente nell'`enabledModules` del tenant.

### Regole sacre

1. **`apps/web` non importa direttamente da `packages/modules/*`**. Importa solo dal `module-registry`, che a sua volta carica i moduli a runtime in base al tenant.
2. **I moduli possono dipendere da `core`, `ui`, `database`, `api`. NON tra di loro direttamente.** Se due moduli devono comunicare, lo fanno via eventi (vedi §9).
3. Niente `index.ts` di barrel re-export a livello di package se non strettamente necessario — rovinano il tree-shaking.

---

## 7. Sistema di moduli — il cuore dell'architettura

Ogni modulo esporta un **manifest** (definito in `packages/core/src/module-registry/types.ts`) che dichiara tutto ciò che il modulo fornisce. Il `module-registry` (`packages/core/src/module-registry/registry.ts`) legge i manifest e configura l'app.

### Anatomia del manifest

Un manifest dichiara (vedi `ModuleManifest` per la definizione completa):

- **`id`** — identificatore univoco (es. `crm-contacts`, `acme-fleet`)
- **`version`** — semver
- **`displayName`** — nome user-facing
- **`dependsOn`** — altri moduli richiesti
- **`routes`** — array di rotte App Router con `path`, `component`, `permissions`
- **`navigation`** — voci di menu da iniettare nella sidebar (con icona, label, sezione)
- **`permissions`** — permessi che il modulo introduce
- **`prismaSchema`** — frammento Prisma con i modelli del modulo
- **`apiRouter`** — router tRPC esportato dal modulo
- **`eventHandlers`** — listener su eventi del bus (deferred al MVP, ma il manifest li prevede)
- **`settingsPage`** — componente per la pagina di configurazione del modulo

### Come si registra un modulo

1. Al boot dell'app, il `module-registry` enumera tutti i moduli in `packages/modules/*` (vedi `loader.ts`).
2. Per ogni richiesta HTTP, dato il tenant, filtra i moduli con `tenant.enabledModuleIds`.
3. Espone:
   - un **router tRPC dinamico** che monta solo i sub-router dei moduli abilitati per quel tenant
   - una **funzione `getNavigation(user, tenant)`** che ritorna le voci di menu filtrate per permessi
   - una **funzione `getApiRouter(tenant)`** che ritorna i router abilitati

### Caricamento frontend ✅ DECISIONE CHIUSA

**Approccio scelto: import diretto in `apps/web`**, niente generazione build-time complessa.

Ogni rotta è un file `apps/web/src/app/(modules)/<module-id>/<path>/page.tsx` che fa:
```ts
export { default } from "@coordinate/modules-<module-id>/pages/<PageName>";
```

Per il MVP a 5 clienti tutti sullo stesso deploy con tutti i moduli compilati, questo è più semplice di uno script `prebuild` che genera codice. Se in futuro servono profili di build separati, si introduce uno script di generazione.

### Error boundaries per modulo

Il sistema deve avere **error boundaries per modulo**: un modulo che esplode non deve far cadere tutta l'app. Pagina admin di diagnostica mostra lo stato di registrazione di ogni modulo.

---

## 8. Custom fields ⏭ DEFERRED dall'MVP

Il sistema di custom fields dinamici (campi configurabili a runtime per tenant) **non è incluso nell'MVP**.

**Razionale**: con ~5 clienti, è più rapido aggiungere un campo nel codice del modulo (10 minuti + deploy) che costruire un sistema di schema dinamico + form generation + validazione runtime + UI builder (settimane di sviluppo).

**Quando si attiva**: se 2+ clienti chiedono lo stesso tipo di personalizzazione "vorrei aggiungere il campo X", o se un cliente vuole gestire da solo l'aggiunta di campi.

**Implementazione pianificata** (se/quando):
- Modello `CustomFieldDefinition` per tenant + entity type
- Colonna `customFields JSONB` su entità estendibili
- Validazione Zod compilata runtime
- Form/table dinamici nei moduli
- 5 tipi base: text, number, date, dropdown, boolean

---

## 9. Eventi e comunicazione tra moduli

I moduli **non si chiamano direttamente**. Comunicano via event bus interno.

**Stato MVP**: il manifest prevede `eventHandlers`, ma l'event bus vero e proprio è ⏭ DEFERRED finché non c'è un caso d'uso reale. Per ora, i moduli sono indipendenti.

**Quando si attiva**: appena due moduli devono parlarsi (es. `crm-pipeline` emette `deal.won` e `activities` crea una task di follow-up automatica).

**Implementazione pianificata**:
- Event bus in-process (EventEmitter sync, async-safe)
- Eventi tipizzati con Zod schemas
- I moduli si iscrivono via `eventHandlers` nel manifest
- Per workflow lunghi/asincroni: passaggio a Inngest (durable)

---

## 10. Autenticazione, ruoli e permessi

### Auth

- **Better-Auth** gestisce login, sessioni, MFA, password reset.
- Estensione **organizations** di Better-Auth = i nostri tenant.
- Un utente può appartenere a più organizzazioni.
- Provider OAuth (Google, Microsoft) configurati globalmente.

### Modello di permessi (RBAC, semplice)

Due livelli nell'MVP:
1. **Ruoli predefiniti**: `owner`, `admin`, `member`, `viewer` — per ogni tenant.
2. **Permessi granulari**: ogni modulo dichiara permessi atomici (es. `crm:contact:write`, `warehouse:product:delete`).

**Niente CASL / attribute-based per ora**. Se un cliente chiede "ogni utente vede solo i suoi lead", lo aggiungiamo.

### Enforcement

- A livello tRPC: middleware `requirePermission('crm:contact:write')` su ogni procedure
- A livello UI: hook `useCan('crm:contact:write')` per nascondere/disabilitare bottoni
- A livello DB: RLS Postgres come ultima difesa

---

## 11. Workflow engine ⏭ DEFERRED

Niente UI di automation nell'MVP. Quando un cliente chiede automazioni:
- Caso semplice → job Inngest hardcoded (es. "ogni notte, alert su deal fermo > 30gg")
- Caso complesso → modulo custom dedicato

Se 3+ clienti chiedono lo stesso tipo di automazione configurabile, allora vale la pena costruire un workflow engine con Inngest + UI di trigger config. Non prima.

---

## 12. Theming e branding per tenant

- CSS variables già in uso → ogni tenant ha un set di colori salvati in `TenantConfig.theme`.
- Al boot, un `<TenantThemeProvider>` inietta le variabili nel `<html>`.
- Logo e favicon serviti da R2 con path `tenants/<slug>/branding/`.
- Font: default. Niente Google Fonts personalizzati (no problemi licenze).

---

## 13. Internazionalizzazione ⏭ DEFERRED

L'MVP è **solo italiano**. Stringhe hardcoded. Niente `next-intl`.

Quando si attiva: se arriva un cliente non-italiano. A quel punto:
- Si installa `next-intl`
- Si estraggono le stringhe in `messages/it.json`
- Si traducono in `messages/en.json` (anche via DeepL/Claude)
- Ogni modulo porta le proprie traduzioni in `packages/modules/<mod>/messages/`

Date/numeri/valute formattati con `Intl.*` API, con locale `it-IT` di default.

---

## 14. Strategia di deploy

### Default (e per ora unico)

- **Un singolo deploy multi-tenant su Vercel** + **Neon** (Postgres EU)
- Tutti i tenant condividono lo stesso `web` e lo stesso DB, isolati via RLS
- Costo marginale per tenant ≈ zero

Con 5 clienti totali, questo è sovradimensionato e perfetto.

### Quando deviare

- **Cliente con compliance forte** (sanità, PA, finanza): deploy dedicato con `DATABASE_URL` separato, stesso codice
- **Cliente che chiede on-premise**: out of scope per ora, eventualmente in futuro

### CI/CD

- **GitHub Actions** per lint + typecheck + test su PR
- Branch `develop` → staging (eventuale), `main` → produzione
- Migration Prisma applicate automaticamente con `prisma migrate deploy`
- Rollback: revert deploy su Vercel + `prisma migrate resolve` per il DB

---

## 15. Roadmap di migrazione dallo stato attuale

Lo stato attuale: Fase 0 e Fase 1 complete. Fase 2 in corso (registry + manifest fatti, migrazione moduli in corso).

Vedi `implementation-tasks.md` per il dettaglio operativo task-by-task.

---

## 16. Decisioni aperte (storico)

| # | Decisione | Stato |
|---|---|---|
| D1 | Identificazione tenant | ✅ Sottodominio (`*.coordinate.app`, dev `lvh.me`) |
| D2 | Caricamento rotte moduli | ✅ Import diretto in `apps/web/src/app/(modules)/<id>/<path>/page.tsx` |
| D3 | API layer | ✅ tRPC |
| D4 | Auth provider | ✅ Better-Auth (organizzazioni native) |
| D5 | Background jobs | ✅ Inngest |
| D6 | Hosting | ✅ Vercel + Neon |
| D7 | Billing | ✅ **Fatturazione manuale**, no Stripe nell'MVP |
| D8 | Strategia custom fields | ✅ **Deferred** — nessun sistema dinamico nell'MVP |
| D9 | Modello prezzi | ✅ **Canone annuale + setup fee** per moduli custom (vedi `pricing.md`) |
| D10 | Lingua del codice | ✅ Inglese |
| D11 | i18n del prodotto | ✅ **Solo italiano** nell'MVP |
| D12 | Cartella `tenants/` per moduli custom | ✅ **No** — moduli custom vivono in `packages/modules/` come gli altri |

---

## 17. Cosa NON fare

- **Non microservizi**. Il modular monolith con manifest copre i prossimi 5+ anni.
- **Non Kubernetes**. Vercel risolve tutto.
- **Non costruire feature "tanto vale"**. Con 5 clienti, ogni feature non richiesta è tempo sprecato.
- **Non aggiungere Stripe / i18n / custom fields "perché un giorno serviranno"**. Si aggiungono quando un cliente reale paga per usarle.
- **Non condividere componenti UI tra moduli importandoli da `packages/modules/altro-modulo`**. Tutto ciò che è condiviso vive in `packages/ui` o `packages/core`.
- **Non permettere ai moduli custom di modificare il core**. Possono solo estendere via hook/eventi. Altrimenti perdi la possibilità di upgrade.
- **Non promettere date di rilascio di moduli non richiesti**. Roadmap pubblica non esiste: si parla solo di cosa si sta facendo *per* il cliente attuale.

---

## Glossario

- **Tenant** = un cliente / azienda che usa il software. Un account isolato. Sinonimo di "organizzazione" in Better-Auth.
- **Modulo** = un'unità funzionale autonoma (CRM, Warehouse, …) con manifest, router, modelli. Vivono tutti in `packages/modules/`.
- **Modulo core** = modulo usato da più clienti.
- **Modulo custom** = modulo usato da un solo cliente, tipicamente finanziato da lui via setup fee.
- **Manifest** = file di metadati che descrive cosa fornisce un modulo.
- **Module registry** = componente del core che enumera, valida e attiva i moduli.
- **RLS** = Row-Level Security, meccanismo Postgres di filtraggio righe a livello DB.
- **`TenantConfig.enabledModules`** = lista di id moduli attivi per un tenant. È l'unico meccanismo per "personalizzare" cosa vede un cliente.
