# Coordinate — MVP Scope (v1.0)

**Versione di rilascio**: 1.0 — il primo Coordinate consegnato a un cliente pagante.

**Tipo di MVP**: boutique platform. Pensato per **~5 clienti totali**, ciascuno con un mix di moduli core + moduli custom scritti su misura. Vendita diretta white-glove, niente self-serve, niente listino pubblico.

**Definizione di "Done"**: 1° cliente in produzione che usa quotidianamente i moduli core + (eventualmente) un suo modulo custom, 30 giorni senza bug critici, time-to-first-value < 30 minuti dal momento in cui il cliente accede al suo tenant.

---

## 1. Filosofia di scope

Tre regole per decidere se una feature entra nel MVP:

1. **"Servirà sul primo cliente reale?"** → se sì, dentro. Se è ipotetica, fuori.
2. **"Costa più costruirla male ora che bene dopo?"** → se sì, dentro (es. multi-tenant, RLS, struttura modulare). Se no, fuori.
3. **"Se un giorno ho 20 clienti dovrò riscriverla?"** → se sì, costruiscila bene ora. Se l'attuale soluzione regge il salto, mantienila semplice.

Cose che il MVP **non** è:
- Un prodotto SaaS aperto al pubblico
- Una piattaforma con signup self-serve
- Un "marketplace di moduli" dove il cliente sceglie cosa attivare da una UI

Cose che il MVP **è**:
- Una piattaforma modulare multi-tenant in cui **tu** crei i tenant, **tu** decidi quali moduli sono attivi per quel cliente, **tu** sviluppi i moduli custom richiesti.

---

## 2. Modello commerciale al lancio

Un solo modello: **canone annuale + setup fee una tantum per i moduli custom**.

- **Canone annuale piattaforma**: include i moduli core abilitati per quel cliente, hosting, manutenzione, supporto. Prezzo negoziato caso per caso.
- **Setup fee per modulo custom**: una tantum, copre design + sviluppo + rilascio del modulo bespoke per quel cliente.
- **Fatturazione**: manuale tramite contratto + fattura PDF. Niente Stripe nell'MVP.

Dettagli sui range di prezzo: vedi `pricing.md`.

---

## 3. Foundation — cosa serve sempre

### `auth` — autenticazione
**IN**: email + password (senza email verification — la abiliteremo se/quando serve), OAuth Google + Microsoft, password reset, sessioni con refresh token, 2FA TOTP opzionale.
**OUT**: SSO/SAML (deferred), magic link, social login esotici.

### `users` & `organizations` (Better-Auth)
**IN**: gestione utenti dentro a un tenant (admin-led: tu inviti, tu rimuovi), un utente può appartenere a più tenant.
**OUT**: utenti guest, ruoli temporanei.

### `rbac` — permessi e ruoli
**IN**: 4 ruoli predefiniti (`owner`, `admin`, `member`, `viewer`), permessi granulari per modulo (dichiarati nel manifest), enforcement a 3 livelli (tRPC middleware + UI hooks + RLS Postgres).
**OUT**: ruoli custom per tenant (deferred), permessi attributo-based.

### `tenant-admin` — settings del tenant
**IN**: pagina settings con dati azienda, logo upload, colore primario, fuso orario, gestione team (invita/rimuovi), abilitazione/disabilitazione moduli.
**OUT**: branding avanzato (font, email template), white-label.

### `tenant-onboarding` (white-glove, no UI pubblica)
**IN**: comando CLI o pagina admin riservata per creare un nuovo tenant: crei record `Tenant`, primo utente `owner`, lista moduli abilitati, dati azienda. Mandi credenziali al cliente via email/canale concordato. Il cliente accede da `coordinate.app/login` e lavora nella sua sezione `coordinate.app/t/<slug>`.
**OUT**: signup self-serve, pricing page pubblica, trial automatico, onboarding wizard.

### `notifications` (in-app, base)
**IN**: notifiche in-app (campanella in header) per eventi rilevanti dei moduli.
**OUT**: email transazionali (deferred — `Resend` aggiunto se/quando serve), push, SMS, digest periodici.

### `audit-log` (base)
**IN**: log automatico di login/logout, modifica/cancellazione entità critiche, cambio impostazioni tenant. Visualizzazione semplice in admin.
**OUT**: diff campo-per-campo, filtri avanzati, export.

### `file-storage`
**IN**: upload file su S3-compatible (Cloudflare R2), allegati per i moduli che ne hanno bisogno, max 25MB per file.
**OUT**: versioning, OCR, anteprime documenti.

### `search` (semplificato)
**IN**: ricerca globale full-text via Postgres `tsvector` sulle entità chiave dei moduli attivi (contatti, deal, prodotti, preventivi). Header search bar.
**OUT**: ricerca semantica AI, filtri avanzati salvati.

### `module-registry`
**IN**: sistema di manifest descritto in `architecture.md` §7. **Tutti i moduli (core e custom) vivono in `packages/modules/<id>/`**, sono package npm a tutti gli effetti. La differenza tra un modulo core e un modulo "custom per Acme" è soltanto:
- chi lo usa (1 cliente vs molti)
- chi lo paga (Acme finanzia lo sviluppo)
- in quale `TenantConfig.enabledModules` compare (solo quello di Acme)

Un solo deploy serve tutti i tenant; ogni tenant vede solo i moduli a lui assegnati.
**OUT**: cartella speciale `tenants/<slug>/modules/`, build profiles separati per tenant, hot-reload moduli, marketplace pubblico.

### `theming` (branding per tenant)
**IN**: logo (upload), colore primario, favicon auto-generata. CSS variables iniettate dal `<TenantThemeProvider>`.
**OUT**: dark mode per-tenant (resta global), font custom, email branding.

---

## 4. Moduli — cosa va costruito nel MVP

### Moduli core inclusi nell'MVP (5)

| ID | Cosa fa | Dimensione |
|---|---|---|
| `crm-contacts` | Anagrafica persone e aziende, relazione padre-figlio, tag, owner | M |
| `crm-pipeline` | Lead e Deal, pipeline configurabile per tenant, Kanban + tabella | M |
| `activities` | Task, call, meeting, note collegate a contatti/deal, vista timeline | S |
| `warehouse` | Prodotti, stock mono-deposito, movimenti in/out, alert sotto soglia | M |
| `dashboard` | Widget fissi (pipeline aperta, deal won mese, task scadenza), drill-down cliccabile | S |

### Moduli supportati ma non costruiti nell'MVP

Questi moduli sono nel catalogo (vedi `modules-catalog.md`) ma vengono costruiti **solo quando un cliente li richiede e li paga come modulo custom o standard upgrade**:

- `calendar` (vista mese/settimana delle activity)
- `quotes` (preventivi PDF)
- `invoicing` / `it-fatturazione-sdi` (fatturazione + SDI)
- `helpdesk` (ticket system)
- Verticali (`vertical-edilizia`, `vertical-real-estate`, ecc.)

La scelta è esplicita: costruire questi moduli "a freddo" senza un cliente che li paghi è ottimizzazione prematura.

### Moduli custom (Tier 4, ma trattati come moduli normali)

Quando un cliente paga per un suo modulo bespoke, lo costruisci in `packages/modules/<id>/` e lo abiliti solo per il suo tenant tramite `TenantConfig.enabledModules`. Esempi tipici:
- "Gestione flotta veicoli" per un cliente logistica
- "Calendario lavorazioni CNC" per un cliente metalmeccanico
- "Cruscotto filiali" per un cliente retail multi-sede

Nessuna magia speciale: stesso manifest, stesso ciclo di build, stesso deploy.

---

## 5. Cosa è esplicitamente FUORI dal MVP

Elenco esplicito per evitare scope creep:

- ❌ **Self-serve signup / pagina pubblica `/signup`** — i tenant li crei tu manualmente
- ❌ **Pricing page pubblica** — niente listino esposto su sito
- ❌ **Landing marketing** — sito statico minimale (eventualmente "chi siamo + contatto"), niente SEO ottimizzato
- ❌ **Stripe / billing automatizzato** — fatturazione manuale
- ❌ **Email transazionali** (welcome, payment, trial) — niente Resend nell'MVP
- ❌ **Trial 14gg** — non esiste il concetto, il cliente firma un contratto
- ❌ **Custom fields dinamici (Tier 2)** — niente sistema di campi configurabili runtime. Se un cliente ha bisogno di un campo, lo aggiungi nel codice del suo modulo (o del modulo core, se è una richiesta generale)
- ❌ **i18n IT + EN** — solo italiano nell'MVP. Stringhe hardcoded in italiano, niente `next-intl`
- ❌ **Workflow engine (Tier 3)** — niente UI di automation
- ❌ **AI features** — niente assistente, niente lead scoring AI
- ❌ **Mobile app nativa** — l'app è responsive web
- ❌ **API pubblica documentata** — webhook outbound forse, REST pubblica no
- ❌ **Marketplace moduli di terzi** — non sei un platform-as-a-product

---

## 6. Requisiti non funzionali del MVP

### Performance
- TTFB pagine principali < 2 secondi (P50)
- Query Postgres < 500ms (P95) — con RLS attivo
- Bundle JS iniziale < 300KB gzipped

### Browser e device
- Chrome, Firefox, Safari, Edge — ultime 2 major versions
- Responsive mobile (≥ 375px width) — utilizzabile da smartphone
- Niente mobile app nativa: PWA come fallback se mai serve

### Affidabilità
- Uptime target 99% (best-effort, niente SLA contrattuale formale per il primo cliente; eventualmente sì sul secondo)
- Backup automatici giornalieri DB, retention 30 giorni
- RPO < 24h, RTO target 4h

### Sicurezza
- HTTPS only, HSTS attivo
- Password con bcrypt (cost ≥ 12) gestita da Better-Auth
- 2FA opzionale per utente, **obbligatorio per ruolo Owner**
- Row-Level Security Postgres su tutte le tabelle multi-tenant
- Rate limiting su `/api/auth/*` (login, password reset)
- Headers di sicurezza (CSP, X-Frame-Options, HSTS)
- Niente segreti nel client bundle

### Privacy / GDPR
- Privacy policy + Terms of Service pubblicati (anche minimi)
- DPA scaricabile / firmabile col cliente
- Export dati tenant su richiesta (script admin → ZIP CSV)
- Delete account → soft-delete 30gg poi hard-delete

### Internazionalizzazione
- Solo italiano. Date/numeri/valute formattati in IT.
- Time zone Europe/Rome di default.

### Accessibilità
- WCAG 2.1 Level AA come target (non blocker per il go-live, ma non scendiamo sotto AA su elementi critici)
- Navigazione tastiera completa
- Screen reader-friendly sui flussi principali

---

## 7. Stack tecnico finale del MVP

Confermato dalle decisioni in `architecture.md`:

```
Frontend:   Next.js 16 (App Router) + React 19 + TypeScript 5
            Tailwind 4 + Shadcn/UI
            Zustand (UI state) + TanStack Query (server state via tRPC)
            React Hook Form + Zod
            Recharts, Framer Motion, Sonner
            (niente next-intl nell'MVP)

Backend:    Next.js Server Actions + tRPC
            Better-Auth (con organizations)
            Prisma + PostgreSQL (Neon o equivalente managed in prod)
            Row-Level Security Postgres
            Inngest (background jobs)

Hosting:    Vercel (web)
            Neon (Postgres)
            Cloudflare R2 (file storage)
            Sentry (errors)
            PostHog (analytics interna, opzionale)

Monorepo:   Turborepo + pnpm workspaces

URL:        coordinate.app (login + eventuale sito pubblico minimo)
            coordinate.app/t/<slug> (sezione tenant) — in dev: localhost:3000/t/<slug>
```

Cosa **NON** è nello stack al lancio:
- Stripe (niente billing automatico)
- Resend (niente email transazionali)
- next-intl (niente i18n)
- Workflow engine / Inngest workflows complessi (Inngest c'è solo per job semplici tipo soft-delete cleanup)

---

## 8. Definition of Done per il MVP

Il MVP è "fatto" e pronto al primo cliente quando **tutte** queste condizioni sono soddisfatte:

### Tecnico
- [ ] Foundation completa (auth, RBAC, tenant-admin, file-storage, search, module-registry, theming)
- [ ] I 5 moduli core (`crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard`) deployati in produzione
- [ ] Test E2E (Playwright) su 4 flussi critici verdi:
  1. Login → dashboard → primo deal creato
  2. Aggiungere contatto + deal + spostarlo su Won
  3. Aggiungere prodotto al magazzino + movimentazione In + alert sotto soglia
  4. Cross-tenant isolation (un tenant non vede dati di un altro)
- [ ] Test isolamento tenant (RLS) automatizzato
- [ ] Backup giornaliero verificato + restore testato almeno una volta
- [ ] Sentry attivo e riceve eventi
- [ ] Logo + favicon + meta tags configurati

### Legale
- [ ] Privacy policy pubblicata (anche minimale, riveduta con un legale)
- [ ] Terms of Service / contratto cliente pronti
- [ ] Cookie banner GDPR (anche minimale, solo per analytics se attivati)
- [ ] DPA bozza firmabile col cliente
- [ ] Dati salvati in EU (Neon EU, R2 EU)

### Operativo
- [ ] Comando admin per creare un tenant (CLI o pagina admin riservata)
- [ ] Email di supporto attiva (`support@coordinate.app` o equivalente)
- [ ] Runbook interno per 5 scenari incident (DB down, deploy fallito, RLS bypass, GDPR request, fraud detection)

### Commerciale
- [ ] **1° cliente reale identificato e contratto firmato**
- [ ] Setup del tenant + utenti del 1° cliente completato
- [ ] Sessione di training iniziale fatta col cliente

---

## 9. Stima sforzo

Stima per **1 sviluppatore full-time** (con esperienza Next.js / React / TS / Postgres):

| Fase | Sforzo (settimane) | Stato |
|---|---:|---|
| Fase 0 — Monorepo setup | 1 | ✅ |
| Fase 1 — Backend, auth, multi-tenant, tRPC, RLS | 3-4 | ✅ |
| Fase 2 — Module Registry + migrazione 5 moduli MVP | 2-3 | in corso |
| Fase 3 — Completamento moduli MVP (rifinitura `crm-contacts` tag, soft delete, import CSV; `crm-pipeline` stadi; `dashboard` widget; `warehouse` import) | 2-3 | |
| Fase 4 — Admin tenant + abilitazione moduli + branding + R2 + GDPR | 1-2 | |
| Fase 5 — Theming applicato + audit log UI + polish UX | 1 | |
| Fase 6 — Testing E2E + security review + performance review | 1-2 | |
| Fase 7 — Legal docs + onboarding del 1° cliente | 1 | |
| **TOTALE** | **12-16 settimane** | ≈ 3-4 mesi |

Riduzione rispetto al piano precedente (17-23 settimane): **5-7 settimane risparmiate** togliendo:
- Stripe + Customer Portal + webhook (Fase 4)
- Onboarding wizard self-serve (Fase 4)
- Trial 14gg automatico (Fase 4)
- Custom fields dinamici (Fase 3)
- next-intl IT+EN (Fase 5)
- Pricing page + landing page (Fase 5)
- Knowledge base + video tutorials + email transazionali (Fase 7)

---

## 10. Rischi noti del MVP

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Il 1° cliente chiede modulo non in scope | Alta | Medio | Si quota come modulo custom (setup fee), si aggiunge al canone. È il modello commerciale. |
| Performance Postgres con RLS sotto carico | Bassa | Medio | Indici + slow query log. Con 5 clienti totali, il carico è gestibile. |
| Compliance GDPR fatto male | Media | Alto | Consulenza legale 4-6h pre-1° cliente |
| Bug critico in produzione senza backup recente | Bassa | Alto | Backup automatici verificati, runbook restore |
| Stretchato sviluppo per attendere "altro cliente" che non arriva | Media | Medio | Lancia col 1° cliente, espandi dopo |
| Lock-in psicologico sul 1° cliente (non puoi dirgli no a nulla) | Alta | Alto | Contratto chiaro su cosa è incluso vs modulo custom a pagamento |

---

## 11. Evoluzione post-MVP

Quando arriva il 2° cliente o il 1° chiede nuovi moduli, si valutano (in ordine indicativo):

1. **`calendar`** se il cliente vive di appuntamenti
2. **`quotes`** se il cliente fa preventivi
3. **`invoicing` + `it-fatturazione-sdi`** se serve fatturazione elettronica
4. **`it-anagrafica-check`** per autocompletamento P.IVA
5. **Custom fields semplificati** se più clienti chiedono "vorrei aggiungere un campo X" (a quel punto vale l'investimento)
6. **i18n** se arriva un cliente non-italiano
7. **Stripe + onboarding self-serve** se cambia il modello commerciale (improbabile a 5 clienti)

Nessuna di queste cose è blocker per il go-live del 1° cliente.
