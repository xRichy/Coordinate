# Coordinate — MVP Scope (v1.0)

**Versione di rilascio**: 1.0 — il primo Coordinate **vendibile** a clienti paganti.

**Tipo di MVP**: Standard. Copre tier Starter + tier Professional completi. Business e Enterprise vendibili come "su richiesta" (lead-to-sales), senza tutte le feature in piattaforma.

**Stima totale**: 18-22 settimane di sviluppo solo (1 dev), 14-16 settimane con 2 dev paralleli (front + back).

**Definizione di "Done"**: 3 clienti paganti reali, 30 giorni di produzione senza bug critici, < 5 ore/settimana di supporto, time-to-first-value < 15 minuti (signup → primo deal creato).

---

## 1. Filosofia di scope

Tre regole per decidere se una feature entra o no nel MVP:

1. **"Posso vendere il prodotto senza?"** → se sì, fuori. Se no, dentro.
2. **"Costa di più costruirlo male ora che bene dopo?"** → se sì, dentro (es. multi-tenant, RLS, struttura modulare). Se no, fuori.
3. **"È un differenziatore reale vs HubSpot/Pipedrive?"** → se sì, valutare per dentro. Se è feature parity con loro, fuori.

Cose che il MVP **non** è:
- Un beta pubblico aperto (è un v1.0 stabile)
- Una demo: gli utenti pagano davvero
- Un prodotto "feature-complete": Wave 2-5 verranno dopo

---

## 2. Tier al lancio

| Tier | Stato MVP | Note |
|---|---|---|
| **Starter** | ✅ Funzionante self-serve | Sign-up automatico, Stripe Checkout, attivazione immediata |
| **Professional** | ✅ Funzionante self-serve | Stesso flusso self-serve di Starter |
| **Business** | ⚠️ "Sales contact" page | Modulo `it-fatturazione-sdi` non pronto. Si può comunque vendere a un Business chiedendo workaround manuale (fatturazione cartacea + provider esterno), ma è sales-led |
| **Enterprise** | ⚠️ "Sales contact" page | Sempre sales-led, nessun automatismo |

**Per il MVP, vendi self-serve solo Starter e Pro. Business/Enterprise sono "call to sales".**

---

## 3. Modelli commerciali al lancio

| Modello | Stato MVP | Implementazione |
|---|---|---|
| **Subscription SaaS** | ✅ Self-serve | Stripe Subscription, fatturazione mensile/annuale automatica |
| **Lifetime License + Cloud Care** | ⚠️ Sales-led | Cliente paga licenza una tantum con Stripe Invoice manuale + sottoscrizione Cloud Care via Stripe. Niente flusso self-serve in v1. Il flusso self-serve arriva in v1.1. |
| **On-Premise** | ⚠️ Sales-led | Quotazione manuale, contratto offline, installazione manuale. Niente UI dedicata in v1. |

---

## 4. Foundation — cosa serve sempre, indipendentemente dai moduli

### `auth` — autenticazione
**IN**: email + password (senza verifica email obbligatoria — abilitata pre-lancio con Resend, vedi T1.16), OAuth Google, OAuth Microsoft, password reset, sessioni con refresh token, 2FA via TOTP (Google Authenticator).
**OUT**: SSO/SAML (→ Wave 3), magic link, social login esotici (Apple, GitHub).

### `users` & `organizations` (Better-Auth)
**IN**: invito utenti via email, accept/reject invite, deattivazione utente, ownership transfer del tenant (1 owner per tenant), un utente può appartenere a più tenant (multi-org).
**OUT**: utenti guest, ruoli temporanei, scadenze ruoli automatiche.

### `rbac` — permessi e ruoli
**IN**: 4 ruoli predefiniti (`owner`, `admin`, `member`, `viewer`), permessi granulari per modulo (dichiarati nei manifest), enforcement a 3 livelli (tRPC middleware + UI hooks + RLS Postgres).
**OUT**: ruoli custom per tenant (→ Wave 2), permessi attributo-based ("vedi solo i tuoi lead"), gerarchie utenti.

### `tenant-admin` — settings tenant
**IN**: pagina settings con: dati azienda (nome, P.IVA, CF, indirizzo), logo upload, colore primario, lingua predefinita (it/en), fuso orario, modulo enable/disable, gestione team (invita/rimuovi utenti).
**OUT**: branding avanzato (font, sfondi, email template), white-label, multi-brand.

### `billing` — fatturazione del SaaS stesso
**IN**:
- Stripe Checkout per nuovo abbonamento (Starter/Pro)
- Stripe Customer Portal per gestione carta, downgrade, cancellazione
- Webhook Stripe → aggiornamento stato tenant
- Fatture generate da Stripe (con dati P.IVA del cliente)
- Email transazionali (Resend): welcome, payment success, payment failed, trial ending, cancellation

**OUT**: 
- UI di billing custom (→ Wave 2)
- Pricing per utente con add-on multipli (→ Wave 2)
- Coupon e codici sconto (→ Wave 2)
- Self-serve per Lifetime e On-premise (→ Wave 2-3)

### `notifications`
**IN**: notifiche in-app (campanella in header), preferenze utente (cosa ricevere), email transazionali per eventi critici.
**OUT**: push web, push mobile, notifiche SMS, digest periodici personalizzati.

### `audit-log` (base)
**IN**: log automatico di: login/logout, modifica/cancellazione entità critiche (contatti, deal, fatture), cambio impostazioni tenant. Visualizzazione semplice in admin.
**OUT**: diff campo-per-campo (→ Wave 3), filtri avanzati, export, retention configurabile.

### `file-storage`
**IN**: upload file su S3-compatible (Cloudflare R2 inizialmente), allegati per contatti/deal/preventivi, max 25MB per file (limite v1), antivirus scan via ClamAV o servizio managed.
**OUT**: versioning file, anteprime per documenti complessi, OCR su upload.

### `search`
**IN**: ricerca full-text globale via Postgres `tsvector` su: contatti, aziende, deal, preventivi. Header search bar con risultati raggruppati per tipo.
**OUT**: ricerca semantica AI, filtri avanzati, sintassi query custom.

### `tenant onboarding flow`
**IN**: sign-up self-serve dalla home (`coordinate.app/signup`):
1. Email + password + nome
2. Setup azienda (nome, slug subdomain auto-suggerito, P.IVA, paese)
3. Scelta tier (Starter/Pro) + carta Stripe (con trial 14gg per entrambi)
4. Redirect a `<slug>.coordinate.app` già loggati
5. Tour guidato in-app (3-4 step) + creazione primo contatto demo

> **Nota**: la verifica email (step rimosso) viene abilitata pre-lancio una volta configurato Resend (T1.16).

**OUT**: import dati da file (manuale possibile via CSV, ma no wizard) (→ Wave 2), migrazione assistita (→ servizio venduto separatamente).

### `module registry & build`
**IN**: sistema di manifest descritto in `architecture.md` §7, generazione build-time delle rotte App Router dai manifest dei moduli **abilitati** per il deploy. Per il MVP: un solo deploy "standard" che include tutti i moduli abilitati per Starter/Pro. I tier Business/Enterprise (con moduli aggiuntivi) verranno in deploy separati quando necessario.
**OUT**: deploy multi-profilo (→ Wave 2 quando arriva il primo Business reale), hot-reload moduli (→ probabilmente mai).

### `custom fields`
**IN**: 5 tipi di campo (text, number, date, dropdown enum, boolean), max 10 custom fields per entità, configurabili dall'admin del tenant, visualizzati in form e tabelle, salvati in colonna JSONB.
**OUT**: tipi avanzati (reference, multi-select, file, formula) (→ Wave 2), validazioni custom (regex, range), permessi per campo (→ Wave 3), traduzioni multi-lingua dei label (→ Wave 2).

### `theming` (tenant branding)
**IN**: logo (upload), colore primario (color picker), favicon auto-generata.
**OUT**: dark mode per-tenant (resta global next-themes default), font custom, sfondi, email branding.

### `i18n`
**IN**: italiano (default) + inglese. Strings via `next-intl`. Solo UI: dati custom (es. nomi pipeline stages) restano monolingua.
**OUT**: altre lingue (spagnolo, francese — facili da aggiungere ma fuori scope), traduzioni dei custom fields, traduzioni dei dati utente.

---

## 5. Moduli — 8 inclusi nel MVP

### M1 — `crm-contacts` ✅ IN MVP

**Cosa fa**: anagrafica persone e aziende, base di tutto il CRM.

**IN scope**:
- Entità Persona (nome, cognome, email, telefono, ruolo)
- Entità Azienda (ragione sociale, P.IVA, CF, indirizzo, settore)
- Relazione padre-figlio (Azienda → Persone)
- Tag (lista flat, no gerarchie)
- Owner (utente proprietario)
- Custom fields (vedi foundation)
- Vista tabella con filtri base (per tag, owner, città)
- Vista dettaglio con timeline attività
- Ricerca header (via search)
- Import CSV (con mapping manuale)
- Export CSV
- Soft delete (cancellazione recuperabile per 30gg)

**OUT scope**:
- Deduplicazione automatica (→ Wave 2)
- Merge manuale di duplicati (→ Wave 2)
- Segmentazione dinamica salvata (→ Wave 2)
- Hierarchie aziendali multi-livello (gruppo → controllata → filiale) (→ Wave 3)
- API pubblica per import (→ Wave 2)

### M2 — `crm-pipeline` ✅ IN MVP

**Cosa fa**: gestione lead e deal con pipeline visuale.

**IN scope**:
- 2 entità: Lead (potenziale cliente) e Deal (trattativa attiva)
- 1 pipeline per tenant, con stadi configurabili dall'admin (default: New, Contacted, Qualified, Proposal, Won, Lost)
- Vista Kanban (drag & drop tra stadi)
- Vista tabella alternativa
- Campi: titolo, contatto associato, azienda associata, valore (€), data attesa chiusura, owner, descrizione
- Conversione Lead → Deal (con creazione automatica contatto se non esiste)
- Conversione Deal Won → cliente (flag su contatto)
- Storico cambi stadio
- Custom fields

**OUT scope**:
- Pipeline multiple per tenant (→ Wave 2)
- Probabilità % per stadio (→ Wave 2)
- Forecast revenue (→ Wave 2)
- Lead scoring (manuale o AI) (→ Wave 3)
- Trigger automatici sui cambi stadio (→ Wave 3 con workflow engine)
- Workflow di approvazione (→ Wave 3)

### M3 — `activities` ✅ IN MVP

**Cosa fa**: task, chiamate, meeting, note collegate a contatti/deal.

**IN scope**:
- 4 tipi: Task, Call, Meeting, Note
- Campi comuni: titolo, descrizione, data/ora, owner, contatto associato (opz), deal associato (opz), stato (todo/in-progress/done)
- Priorità (low/medium/high) per Task
- Timeline su contatto/deal (cronologia attività)
- Vista "le mie attività" per utente loggato
- Promemoria via in-app notification (alle X ore prima)
- Custom fields

**OUT scope**:
- Task ricorrenti (→ Wave 2)
- Dipendenze tra task (→ Wave 2)
- Time tracking integrato (→ modulo separato Wave 2-3)
- Email logging automatico (→ richiede `email-integration`, Wave 2)
- Chiamate registrate (→ richiede `voip-integration`, Wave 3)

### M4 — `calendar` ✅ IN MVP

**Cosa fa**: vista calendario di tutte le attività con data/ora.

**IN scope**:
- Vista mensile e settimanale
- Eventi = attività di tipo Meeting + Call con data/ora
- Codifica colori per owner (max 8 colori a rotazione)
- Click su evento → drawer dettaglio attività
- Creazione evento direttamente dal calendario

**OUT scope**:
- Sincronizzazione bidirezionale Google/Outlook (→ Wave 2, `calendar-sync`)
- Inviti partecipanti esterni (→ richiede `email-integration`)
- Disponibilità/booking pages tipo Calendly (→ Wave 3+)
- Ricorrenze (→ con task ricorrenti, Wave 2)
- Time zones diverse per utente (resta sul TZ del tenant) (→ Wave 2)

### M5 — `dashboard` ✅ IN MVP

**Cosa fa**: KPI overview, prima cosa che vede l'utente al login.

**IN scope**:
- 6 widget fissi:
  1. Pipeline totale aperta (€)
  2. Deal vinti questo mese (€)
  3. Lead nuovi questo mese (#)
  4. Conversion rate (%)
  5. Attività in scadenza prossimi 7gg (#)
  6. Grafico area: ricavi mensili ultimi 6 mesi
- Layout fisso (no drag & drop, no personalizzazione)
- Filtri: periodo (mese / trimestre / anno), owner (proprio / team / tutti per admin)
- Tutti i numeri cliccabili → portano alla lista filtrata

**OUT scope**:
- Widget personalizzabili (→ Wave 2)
- Dashboard multipli per ruolo (→ Wave 3)
- Report custom (→ Wave 2, `reports-builder`)
- Export PDF del dashboard (→ Wave 3)

### M6 — `warehouse` (base) ✅ IN MVP — solo Pro tier

**Cosa fa**: gestione prodotti e movimentazioni base. Modulo abilitato di default per Pro.

**IN scope**:
- Entità Prodotto (SKU, nome, descrizione, categoria, prezzo vendita, costo, stock corrente, soglia minima)
- 1 deposito unico per tenant
- Movimenti In/Out manuali (con causale)
- Storico movimentazioni
- Alert visivo (badge) per stock sotto soglia
- Categorie (flat, no gerarchie)
- Import CSV prodotti
- Custom fields

**OUT scope**:
- Multi-deposito (→ `warehouse-multi`, Wave 2)
- Barcode (→ `barcode`, Wave 2)
- Lotti/seriali (→ Wave 3)
- Listini multipli (→ Wave 2)
- Distinta base (→ `production`, vertical manifattura, Wave 4)
- Trasferimenti tra depositi (→ con multi-deposito)
- Inventario fisico/conta (→ Wave 3)

### M7 — `quotes` (preventivi) ✅ IN MVP — solo Pro tier

**Cosa fa**: creazione preventivi PDF da inviare via email.

**IN scope**:
- Entità Preventivo (numero, data, cliente, deal associato, stato, validità, totali)
- Righe preventivo (prodotto o testo libero, quantità, prezzo, sconto % per riga, totale)
- Sconto globale %
- IVA configurabile (22% default, altri valori ammessi)
- Generazione PDF (template fisso brandato col logo del tenant)
- Invio via email al cliente (con Resend)
- Stati: bozza, inviato, accettato, rifiutato, scaduto
- Storico modifiche

**OUT scope**:
- Conversione automatica → ordine (→ richiede modulo `orders`, Wave 2)
- Conversione automatica → fattura (→ richiede `invoicing`, Wave 3)
- Workflow di approvazione interno (→ Wave 3)
- Template PDF personalizzabili dall'utente (→ Wave 2)
- Firma elettronica integrata (→ `e-signature`, Wave 3)
- Versioning (preventivo v2, v3) (→ Wave 2)
- Listini di vendita (→ con `pricing-rules`, Wave 3)

### M8 — `it-anagrafica-check` ✅ IN MVP — quick win italiano

**Cosa fa**: validazione P.IVA / CF e autocompletamento dati azienda. Vendibile come differenziatore italiano.

**IN scope**:
- Validazione P.IVA via formula (checksum)
- Verifica P.IVA via VIES (UE)
- Validazione Codice Fiscale via algoritmo
- Autocompletamento dati azienda da P.IVA (provider: `openapi.it` o equivalente, costo per chiamata da pagare)
- UI: bottone "Verifica" accanto al campo P.IVA, suggerisce di autocompilare anagrafica se valida
- Quota mensile per tenant: 100 verifiche/mese incluse (Starter), 500/mese (Pro). Oltre, pay-per-use.

**OUT scope**:
- Verifica creditizia (Cerved, CRIF) (→ vertical commercialisti, Wave 4)
- Dati storici azienda (bilanci, soci) (→ Wave 4)
- Visure camerali (→ vertical commercialisti)

---

## 6. Cosa NON è nel MVP (con piano di rilascio)

### Wave 2 (mesi 5-9 post-MVP) — espansione modulare
- `warehouse-multi`, `barcode` — multi-deposito e barcode
- `orders` — conversione preventivo → ordine
- `helpdesk` (base) — ticketing
- `email-integration` — sync Gmail/Outlook
- `reports-builder` — report custom
- `calendar-sync` — sync Google/Outlook calendar
- Self-serve flow per **Lifetime License** (oggi è sales-led)
- Custom fields avanzati (reference, multi-select, file)
- Pipeline multiple per tenant
- Ruoli custom per tenant
- Workflow base (trigger semplici sui cambi stato)

### Wave 3 (mesi 9-14) — tier Business
- `invoicing` — fatturazione
- `it-fatturazione-sdi` — SDI completo (il modulo "premium italiano")
- `subscriptions` — fatturazione ricorrente
- `email-marketing` — newsletter base
- `customer-portal` — portale cliente finale
- `sso-saml`, `gdpr-toolkit` — compliance per enterprise
- Workflow engine completo (Tier 3 personalizzazioni)
- Integrazione Stripe avanzata (subscription per utente + add-on)

### Wave 4 (mesi 14-20) — moduli avanzati e AI
- `ai-assistant`, `ai-content-gen`, `ai-email-summary`
- `marketing-automation`
- `time-tracking`, `projects`
- `e-signature`
- Integrazioni gestionali italiani (`teamsystem`, `fattureincloud`)
- Primo verticale (in base ai clienti acquisiti)
- Tier 4 — primi moduli custom per clienti enterprise paganti

### Wave 5 e oltre
- HR completo, accounting integrato
- Embedded BI
- Verticali aggiuntivi
- Mobile app nativa (se la domanda lo giustifica)

---

## 7. Requisiti non funzionali del MVP

### Performance
- TTFB pagine principali < 2 secondi (P50)
- TTI dashboard < 3 secondi (P75)
- Query Postgres < 500ms (P95) — con RLS attivo
- Bundle JS iniziale < 300KB gzipped

### Browser e device
- Chrome, Firefox, Safari, Edge — ultime 2 major versions
- Responsive mobile (≥ 375px width) — utilizzabile da smartphone
- **No mobile app nativa nel MVP**: la PWA è il fallback

### Affidabilità
- Uptime target 99% (best-effort, nessun SLA contrattuale per i primi 3 mesi)
- Backup automatici giornalieri DB, retention 30 giorni
- Recovery Point Objective (RPO) max 24h
- Recovery Time Objective (RTO) target 4h

### Sicurezza
- HTTPS only, HSTS attivo
- Password con bcrypt (cost ≥ 12)
- 2FA opzionale per utente, **obbligatorio per ruolo Owner**
- Row-Level Security Postgres attivo su tutte le tabelle multi-tenant
- Rate limiting su endpoint sensibili (login, password reset, sign-up)
- CSRF protection (Better-Auth lo include)
- Sanitizzazione input lato server (Zod)
- Niente segreti in client bundle (verifica con grep pre-deploy)
- Headers di sicurezza (CSP, X-Frame-Options, ecc.)

### Privacy / GDPR
- Cookie banner solo per analytics (PostHog) — niente cookie per funzionamento
- Privacy policy + Terms of Service pubblicati pre-lancio
- DPA (Data Processing Agreement) scaricabile
- Export dati utente su richiesta (manuale per MVP, in admin: "export tenant data" → ZIP CSV)
- Delete account → soft-delete 30gg poi hard-delete

### Internazionalizzazione
- it (default), en
- Formato date/numeri/valute in base al locale utente
- Time zone in base al tenant (con override per utente)

### Accessibilità
- WCAG 2.1 Level AA come target (non come blocker per il lancio, ma non scendiamo sotto AA su elementi critici)
- Navigazione da tastiera completa
- Screen reader compatibility sui flussi principali

---

## 8. Stack tecnico finale del MVP

Confermato dalle decisioni architetturali chiuse:

```
Frontend:   Next.js 16 (App Router) + React 19 + TypeScript 5
            Tailwind 4 + Shadcn/UI
            Zustand (UI state) + TanStack Query (server state via tRPC)
            React Hook Form + Zod
            Recharts, Framer Motion, Sonner
            next-intl

Backend:    Next.js Server Actions + tRPC
            Better-Auth (con organizations)
            Prisma 7 + PostgreSQL (Neon)
            Row-Level Security Postgres
            Inngest (background jobs, anche se MVP-light)

Hosting:    Vercel (web)
            Neon (Postgres)
            Cloudflare R2 (file storage)
            Resend (email)
            Stripe (billing)
            Sentry (errors)
            PostHog (analytics)

Monorepo:   Turborepo + pnpm workspaces

URL:        coordinate.app (marketing)
            *.coordinate.app (tenants)
            in dev: *.lvh.me:3000
```

---

## 9. Cosa è (volutamente) lasciato fuori

Elenco esplicito per evitare scope creep durante lo sviluppo:

- ❌ **Mobile app nativa** — PWA è abbastanza
- ❌ **Workflow engine visuale** — Tier 3, post-MVP
- ❌ **AI features** — niente assistente conversazionale, niente generazione testi, niente lead scoring AI
- ❌ **Marketing automation** — niente sequenze drip, niente lead nurturing
- ❌ **SSO/SAML** — solo OAuth Google e Microsoft (per Enterprise post-MVP)
- ❌ **API pubblica documentata** — webhook outbound forse sì in v1.0, API REST pubblica no
- ❌ **Multi-language oltre IT/EN**
- ❌ **Real-time collaboration** (cursori live, commenti)
- ❌ **Chat live interna al team**
- ❌ **Marketplace di moduli di terzi**
- ❌ **White-label**
- ❌ **Modulo `it-fatturazione-sdi`** — è il modulo "premium" che giustifica il tier Business. Spostato a Wave 3 perché:
  - Richiede accreditamento provider SDI (Aruba/Fatture in Cloud/Notartel) → 4-6 settimane lead time
  - Test ambiente di pre-produzione SDI complesso
  - Senza un cliente Business già pagante che lo chiede, è ottimizzazione prematura
- ❌ **Modulo `helpdesk`** — il Pro tier nel pricing lo include, ma nel MVP no. Soluzione: in v1.0 il tier Pro vende senza helpdesk e nella roadmap pubblica si dichiara "Q2 2026" (o equivalente). Trasparenza con i prospect.

⚠️ **Implicazione sul pricing**: la prima release di Pro vale meno di quanto descritto nel pricing.md. Due opzioni:
1. **Lanciare Pro a prezzo scontato** (es. €25/u/m invece di €32) finché helpdesk + email marketing non sono pronti
2. **Lanciare Pro al prezzo pieno** ma con commitment scritto su roadmap

Raccomando **opzione 1**, con re-pricing automatico per i primi clienti quando i moduli arrivano.

---

## 10. Definition of Done per il MVP

Il MVP è "fatto" e pronto al lancio quando **tutte** queste condizioni sono soddisfatte:

### Tecnico
- [ ] Tutti i moduli (foundation + 8 moduli MVP) deployati in produzione
- [ ] Test E2E (Playwright) su 5 flussi critici verdi:
  1. Sign-up → tenant creato → primo login
  2. Aggiungere contatto + deal + spostarlo su Won
  3. Creare preventivo + inviarlo via email
  4. Aggiungere prodotto al magazzino + movimentazione In
  5. Verificare P.IVA + autocompilare azienda
- [ ] Test su isolamento tenant (RLS): verificato che da tenant A non si possono leggere dati di tenant B (test automatizzato)
- [ ] Stripe webhook validati con test mode + un transazione reale
- [ ] Backup giornaliero verificato (almeno una volta restore funzionante)
- [ ] Sentry + PostHog attivi e ricevono eventi
- [ ] Logo + favicon + meta tags configurati

### Legale
- [ ] Privacy policy pubblicata (consigliato: copy da template + revisione legale)
- [ ] Terms of Service pubblicati
- [ ] Cookie banner conforme GDPR
- [ ] DPA scaricabile
- [ ] Verificata conformità: dati salvati in EU (Neon: scegliere regione EU; R2: regione EU; Resend: EU; Stripe: PCI)

### Prodotto
- [ ] Knowledge base con almeno 30 articoli (15 IT + 15 EN, anche solo traduzione)
- [ ] 5 video tutorial pubblicati (sign-up, contacts, pipeline, quotes, billing)
- [ ] In-app tour per nuovo utente (4-6 step)
- [ ] Email transazionali finalizzate con Resend (T1.16): welcome, verify email, password reset, invite, payment success, payment failed, trial ending, account deleted
- [ ] Stato moduli + roadmap pubblica visibile sul sito (es. `/roadmap`)

### Operativo
- [ ] Email di supporto attiva (`support@coordinate.app`)
- [ ] Pagina di status pubblica (statuspage.io o equivalente)
- [ ] Runbook interno per 5 scenari di incident (DB down, deploy fallito, RLS bypass, fraud detection, GDPR request)
- [ ] Pricing pubblicato su `/pricing` (versione semplificata da `pricing.md` §11)

### Commerciale
- [ ] Almeno **3 clienti pilota** identificati e pronti a firmare/pagare al go-live
- [ ] Almeno **1 dei 3 clienti** è su tier Pro (non solo Starter)
- [ ] Almeno **5 prospect** contattati che hanno validato il pricing (vedi roadmap setting fase "Validare con 5 prospect")

---

## 11. Stima sforzo per fase

Stima per **1 sviluppatore full-time** (con esperienza Next.js / React / TypeScript / Postgres):

| Fase | Sforzo (settimane) | Note |
|---|---:|---|
| Fase 0 — Monorepo setup, riorganizzazione codice esistente | 1 | |
| Fase 1 — Backend, auth, tenant middleware, RLS, tRPC | 3-4 | La parte più "infrastrutturale" |
| Fase 2 — Module registry + manifest pattern + estrazione moduli esistenti (CRM, warehouse, tasks) | 2-3 | Riusi codice esistente migrato |
| Fase 3 — Completamento moduli MVP (calendar, dashboard, quotes, it-anagrafica-check) | 4-5 | Costruzione nuovi moduli |
| Fase 4 — Billing Stripe + tenant onboarding self-serve + admin tenant + custom fields | 3-4 | Flusso commerciale |
| Fase 5 — i18n, theming, audit log, search, polish UX | 2 | Rifinitura |
| Fase 6 — Test E2E + sicurezza + performance + observability | 1-2 | Hardening |
| Fase 7 — Legal + KB + tutorial + email transazionali + launch prep | 1-2 | Pre-lancio |
| **TOTALE** | **17-23 settimane** | ≈ 4.5-6 mesi |

Con 2 sviluppatori paralleli (front + back specializzati): **3.5-4 mesi**.

Con scope creep "moderato" (1 modulo aggiuntivo richiesto a metà): **+3-4 settimane**.

---

## 12. Rischi noti del MVP

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Scope creep su moduli "vorrei aggiungere anche..." | Alta | Alto | Questo documento. Ogni richiesta di feature post-MVP va in Wave 2+. |
| Custom fields complessi richiesti da prospect | Media | Medio | Limitazione esplicita a 5 tipi nel MVP, comunicata in vendita |
| Performance Postgres con RLS sotto carico | Bassa | Medio | Indici espressione + query review. Monitoraggio con Sentry Performance |
| Sign-up self-serve abusato (signups massivi falsi) | Media | Basso | Rate limit su `/api/auth/*` + Cloudflare Turnstile su sign-up (email verification abilitata pre-lancio con T1.16) |
| Stripe webhook delays / failures | Bassa | Medio | Idempotenza + reconciliation job giornaliero |
| Cliente pilota chiede modulo non in scope | Alta | Medio | Pricing custom development (Tier 4) trasparente, MVP fermo sul suo perimetro |
| Compliance GDPR fatto male | Media | Alto | Consulenza legale 4-6h pre-lancio + audit privacy minimo |
| Burnout solo-dev se MVP si allunga | Alta | Alto | Stop ogni 4 settimane per review scope. Tagliare prima di stancarsi. |
