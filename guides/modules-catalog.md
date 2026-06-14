# Coordinate — Catalogo Moduli

Catalogo ragionato di moduli che ha senso costruire su Coordinate. Ogni modulo è un'unità autonoma con manifest, modelli, rotte, permessi.

Con il modello boutique a ~5 clienti (vedi `mvp-scope.md`), **non costruiamo moduli a freddo**: un modulo entra nel codebase solo quando un cliente reale lo richiede e lo paga (o quando è incluso nei moduli core scelti per l'MVP iniziale).

Questo documento serve come **mappa mentale**: cosa potremmo costruire, in che ordine ha senso costruirlo, quanto è grande. È riferimento per i preventivi, non una roadmap di sviluppo.

## Tassonomia

Ogni modulo appartiene a una **categoria** e ha uno **stato**:

**Stato**:
- **Core MVP** — incluso nel MVP, costruito subito
- **Catalog** — disponibile a preventivo, costruito quando un cliente lo paga
- **Custom-only** — pensato per un cliente specifico, non promosso a catalog finché non ci sono 2+ clienti che lo userebbero

**Sigle dimensione**:
- `[S]` = piccolo (1-2 settimane di sviluppo)
- `[M]` = medio (1-2 mesi)
- `[L]` = grande (3-6 mesi)
- `[XL]` = molto grande (6+ mesi)
- `→` = dipendenza da un altro modulo

---

## 1. Foundation (parte del core, non vendibile separatamente)

Componenti che ogni cliente ha. Vivono in `packages/core/`.

| Modulo | Cosa fa | Note |
|---|---|---|
| **auth** | Login, sessioni, MFA, password reset, OAuth | Better-Auth |
| **users / team** | L'owner crea account legati al tenant, ruoli, deattivazione; **limite posti** `maxSeats` (default 2) | No invito email; slot extra a pagamento |
| **rbac** | 4 ruoli predefiniti + permessi granulari per modulo | Niente CASL nell'MVP |
| **tenant-admin** | Settings tenant: abilitazione moduli (✅), team. Dati azienda/branding rinviati | |
| **platform-admin** | Sezione `/admin` solo operatore (allowlist email): crea tenant, aumenta slot account, sospende, moduli | T4.18 |
| **module-registry** | Sistema di manifest + loader | ✅ Già costruito |
| **notifications** (in-app) | Campanella in header, eventi rilevanti dei moduli | Niente email transazionali nell'MVP |
| **audit-log** (base) | Tracciamento azioni base (login, modifiche critiche) | |
| **file-storage** | Upload su **Vercel Blob** (non più R2) | Allegati foto/PDF, T4.24 |
| **search** | Ricerca globale full-text via Postgres `tsvector` | Indicizza modelli registrati dai moduli |

---

## 2. Moduli MVP — Core CRM (Core MVP)

I 5 moduli che vengono costruiti nell'MVP iniziale.

### `crm-contacts` `[M]` — Core MVP
Anagrafica persone e aziende. Relazione padre-figlio (azienda → persone). Tag, owner. Soft delete con ripristino entro 30 giorni. Import/export CSV.
- Emette eventi (quando l'event bus sarà attivo): `contact.created`, `contact.updated`

### `crm-pipeline` `[M]` — Core MVP
→ `crm-contacts`
Lead e Deal. Pipeline configurabile per tenant (stadi custom). Kanban + tabella. Valore atteso, data di chiusura, owner. Conversione Lead → Deal → Customer.
- Emette eventi: `lead.stage.changed`, `deal.won`, `deal.lost`

### `activities` `[S]` — Core MVP
→ `crm-contacts`
Task, chiamate, meeting, note. Vista timeline su contatto/deal. Le mie attività.

### `warehouse` `[M]` — Core MVP
Prodotti, categorie, stock mono-deposito, movimentazioni in/out. Alert visivo per stock sotto soglia. Import CSV prodotti.

### `dashboard` `[S]` — Core MVP
Widget fissi (pipeline aperta €, deal won mese, lead nuovi mese, conversion rate, task scadenza 7gg, ricavi 6 mesi). Filtri periodo + owner. Numeri cliccabili → drill-down.

---

## 3. Moduli a catalogo — vendibili a preventivo

Moduli per cui esiste già un design mentale, ma che si costruiscono solo quando un cliente li paga.

### CRM avanzato

**`calendar` `[M]`** — Vista calendario settimanale/mensile delle activity. Click su slot vuoto → nuova activity. Niente sync Google/Outlook nell'MVP (sarebbe `calendar-sync` separato).

**`it-anagrafica-check` `[S]`** — Verifica P.IVA via VIES, validazione Codice Fiscale, autocompletamento azienda da P.IVA (provider tipo `openapi.it`). Quick win italiano.

**`lead-scoring` `[M]`** — Regole di punteggio configurabili (apertura email = +5, visita pricing = +10).

### Ciclo documentale

**`quotes` `[M]`** — 🟢 **In MVP (Fase 4.5, T4.20–T4.21)** per il cliente metalmeccanico. Preventivi con righe articolo, sconti, IVA configurabile, generazione PDF brandato (logo + colore tenant). Stati: bozza/inviato/accettato/rifiutato/scaduto.

**`orders` `[M]`** — Conversione preventivo → ordine cliente. Stato (confermato/in lavorazione/evaso). Allocazione stock se `warehouse` attivo. *Nota: per il rivenditore (cliente B) un `SalesOrder` semplificato + margini è in MVP (T4.22); per il metalmeccanico le commesse sono `work-orders` (T4.23). Il modulo `orders` completo resta a catalogo.*

**`invoicing` `[L]`** — Fatture, note di credito, acconti. Numerazione configurabile. Scadenziario, solleciti. **Non include SDI** — quello è `it-fatturazione-sdi`.

**`subscriptions` `[L]`** — → `invoicing`. Contratti ricorrenti, fatturazione automatica, rinnovi, upgrade/downgrade.

**`contracts` `[M]`** — Repository contratti, scadenze, allegati. Integrabile con firma elettronica.

### Moduli Italia (differenziatore locale)

**`it-fatturazione-sdi` `[L]`** — → `invoicing`. Invio fatture al Sistema di Interscambio, ricezione fatture passive. Via provider partner (Aruba, Fatture in Cloud API, Notartel). Probabilmente il modulo a maggior valore percepito per clienti italiani.

**`it-conservazione` `[M]`** — → `it-fatturazione-sdi`. Conservazione sostitutiva 10 anni via provider.

**`it-pec` `[S]`** — Invio PEC dalla piattaforma, tracciamento ricevute.

**`it-f24` `[M]`** — Generazione F24 (verticale per studi commercialisti).

### Operations & Magazzino avanzati

**`warehouse-multi` `[M]`** — → `warehouse`. Multi-deposito, trasferimenti, ubicazioni.

**`barcode` `[S]`** — → `warehouse`. Lettura barcode web + mobile, stampa etichette.

**`suppliers` `[M]`** — Anagrafica fornitori, listini, RDA, ordini fornitore.

**`logistics` `[M]`** — → `warehouse`. DDT, tracciamento spedizioni, integrazione corrieri.

**`production` `[L]`** — → `warehouse`, `suppliers`. Distinta base (BOM), ordini di produzione, fasi di lavorazione. Solo per manifattura reale. *Nota: una versione **semplificata** (commesse/`work-orders`: stato + scadenze + kanban, senza BOM) è in MVP (Fase 4.5, T4.23) per il cliente metalmeccanico; il `production` completo con BOM resta a catalogo.*

### Customer Service

**`helpdesk` `[L]`** — → `crm-contacts`. Ticket system, SLA, email-to-ticket.

**`knowledge-base` `[M]`** — Articoli pubblici/privati, ricerca, categorie.

**`live-chat` `[L]`** — → `helpdesk`. Widget chat per sito cliente, transcript come ticket.

**`customer-portal` `[L]`** — Portale per cliente finale (non utente CRM): vede fatture, ticket, contratti.

**`sla-management` `[M]`** — → `helpdesk`. Definizione SLA, alert escalation.

### Project Management & Time

**`projects` `[L]`** — Progetti, milestone, task strutturati, dipendenze.

**`time-tracking` `[M]`** — → `projects` (opzionale). Timesheet, timer in-app, esportabile in fattura.

**`gantt` `[M]`** — → `projects`. Vista Gantt drag&drop.

**`resource-planning` `[L]`** — → `projects`. Capacity, overbooking.

### HR

**`hr-employees` `[M]`** — Anagrafica dipendenti, organigramma, scadenze documenti.

**`hr-attendance` `[L]`** — → `hr-employees`. Timbrature, turni, straordinari.

**`hr-leave` `[M]`** — → `hr-employees`. Ferie/permessi, workflow approvazione.

**`hr-expenses` `[M]`** — → `hr-employees`. Note spese con OCR opzionale.

**`hr-recruiting-ats` `[L]`** — Job posting, candidati, pipeline assunzione.

**`hr-performance` `[L]`** — Review periodiche, OKR, 360° feedback.

### Finance & Accounting

> **Decisione strategica**: l'accounting completo (registri IVA, libri sociali, dichiarativi) è un mondo enorme che TeamSystem/Zucchetti dominano. Sconsigliato costruirlo. Si costruiscono invece **pezzi pre-contabili** che si integrano col commercialista del cliente.

**`cashflow` `[M]`** — Cash flow previsto vs effettivo, categorizzazione.

**`bank-reconciliation` `[L]`** — Import movimenti bancari (PSD2/CSV), matching automatico con fatture.

**`budget-forecast` `[M]`** — Budget annuale per centro di costo, confronto consuntivo.

### Documenti & Comunicazione

**`dms` `[M]`** — Document Management: cartelle, versioning, permessi, ricerca full-text PDF/Word.

**`document-templates` `[M]`** — Template con placeholder, generazione documenti da dati CRM.

**`e-signature` `[M]`** — Firma elettronica via provider (DocuSign, Yousign, Namirial).

**`email-integration` `[L]`** — Sync IMAP/Exchange/Gmail bidirezionale.

**`voip-integration` `[M]`** — Click-to-call, log chiamate, popup contatto su entrante.

**`whatsapp-business` `[M]`** — Conversazioni WhatsApp Business dentro al CRM.

**`sms` `[S]`** — SMS transazionali via Skebby/Twilio.

### Marketing

**`email-marketing` `[L]`** — Liste, segmenti, template builder, invio massivo, statistiche. Compliance GDPR built-in.

**`marketing-automation` `[XL]`** — → `email-marketing`, `crm-contacts`. Workflow visuali, drip campaigns, lead scoring automatico.

**`forms-landing` `[M]`** — Form builder, landing page, embed su siti esterni.

**`social-publishing` `[M]`** — Programmazione post FB/IG/LinkedIn.

### Analytics & BI

**`reports-builder` `[L]`** — Report visuale drag&drop su dati CRM + moduli.

**`embedded-bi` `[XL]`** — Embed Metabase/Superset multi-tenant aware.

**`data-export` `[S]`** — Export CSV/Excel programmati via email o S3.

### Compliance & Security

**`gdpr-toolkit` `[M]`** — Data export per cliente finale, right-to-be-forgotten, consensi tracciati.

**`sso-saml` `[M]`** — SAML 2.0 + OIDC. Required per enterprise.

**`audit-log-advanced` `[M]`** — Estende base: diff campo-per-campo, retention configurabile, export.

**`backup-restore` `[M]`** — Backup on-demand, restore selettivo.

### AI & Smart features

**`ai-assistant` `[M]`** — Assistente conversazionale interno via API LLM (Claude/OpenAI).

**`ai-email-summary` `[S]`** — → `email-integration`. Riassunto thread, suggerimento risposta.

**`ai-lead-scoring` `[M]`** — → `crm-pipeline`. Scoring lead basato su comportamento.

**`ai-content-gen` `[S]`** — Generazione testi: bozze email, descrizioni prodotto.

**`ai-voice-notes` `[M]`** — → `activities`. Note vocali mobile → trascrizione.

**`ai-document-extract` `[L]`** — OCR + estrazione strutturata da documenti.

---

## 4. Integrazioni

Sono moduli a tutti gli effetti (manifest, rotte di config, job di sync).

**`integration-zapier-make` `[S]`** — Endpoint trigger/action per Zapier e Make. Copre il 90% delle richieste di "integrazione minore".

**`integration-webhooks` `[S]`** — Webhook outbound configurabili su eventi tenant.

**`integration-api-public` `[M]`** — API REST documentata (OpenAPI), token per tenant.

**`integration-teamsystem` `[L]`** — Sync con TeamSystem. Connettore complesso, valore altissimo per clienti già su TS.

**`integration-fattureincloud` `[M]`** — Per partite IVA piccole già su Fatture in Cloud.

**`integration-zucchetti` `[L]`** — Sync con Zucchetti.

**`integration-shopify` / `integration-woocommerce` / `integration-magento` / `integration-prestashop`** — Connettori e-commerce.

**`integration-stripe` `[S]`** — → `invoicing`. Pagamenti carta su fatture (se mai serve nell'MVP per fatturare al cliente finale del cliente).

**`integration-payment-italian` `[M]`** — Nexi, Satispay, PayPal, bonifico immediato.

**`integration-banks-psd2` `[L]`** — → `bank-reconciliation`. Open Banking PSD2 per movimenti automatici.

**`integration-google-workspace` / `integration-microsoft365`** — Sync mail, calendar, drive, contacts.

---

## 5. Verticali (industry-specific)

Moduli per un settore preciso. Tipicamente nascono come modulo custom per un cliente di quel settore e si valuta poi se promuoverli a verticale generalizzato (servirebbero 2-3 clienti dello stesso settore).

| Verticale | Dimensione | Note |
|---|---|---|
| `vertical-studi-professionali` (avvocati, commercialisti, architetti) | L | Pratiche, timesheet professionale, parcellazione |
| `vertical-edilizia` | XL | Cantieri, mezzi, SAL, DVR sicurezza |
| `vertical-real-estate` | L | Immobili, contratti locazione, sync portali |
| `vertical-sanita` | L | Pazienti (privacy potenziata), agende, cartelle minime |
| `vertical-fitness` | M | Iscritti, abbonamenti, corsi |
| `vertical-wedding-events` | M | Sposi, fornitori, timeline evento |
| `vertical-automotive` | L | Officina meccanica: parco veicoli, scadenze, ricambi |
| `vertical-ristorazione` | L | Prenotazioni tavoli, menù, allergeni, food cost |
| `vertical-hotel-bb` | L | Prenotazioni camere, channel manager, comunicazione alloggiati |

---

## 6. Moduli custom — il pattern per il modello boutique

Nel modello a 5 clienti, **i moduli custom non sono un caso eccezionale**: sono il modo normale di lavorare. Quasi ogni cliente avrà 1-2 moduli pensati per lui.

### Esempi reali tipici

- Modulo "Gestione Flotta" per un cliente logistica → veicoli, scadenze (assicurazione/bollo/revisione), itinerari, autisti
- Modulo "Calendario Lavorazioni CNC" per un cliente metalmeccanico → ordini di lavorazione, fasi, macchinari, manutenzione
- Modulo "Cruscotto Filiali" per un cliente retail multi-sede → KPI per filiale, confronto, alert su anomalie
- Modulo "Pratiche Edilizia" per un cliente che gestisce permessi → SCIA, CILA, integrazione con SUE/SUAP comunali
- Integrazione bespoke con un gestionale proprietario del cliente

### Pattern di costruzione

1. **Discovery col cliente**: 1-3 sessioni per capire processi, modelli dati, flussi
2. **Quote** con setup fee one-shot + impatto sul canone annuale (manutenzione + hosting di quel modulo)
3. **Sviluppo** come modulo normale in `packages/modules/<client>-<feature>/` (es. `acme-fleet`)
4. **Manifest**: dichiara rotte, navigation, modelli Prisma, permessi
5. **Attivazione**: aggiungi l'id del modulo a `TenantConfig.enabledModules` del cliente
6. **Deploy**: stesso codice di tutti

### Quando "promuovere" un modulo custom a catalog

Quando 2+ clienti userebbero lo stesso modulo (anche con piccole differenze). A quel punto:
- Si rinomina (rimuovendo il prefisso cliente, es. `acme-fleet` → `fleet`)
- Si entra nel catalogo
- Il cliente che ha co-finanziato lo sviluppo originale ottiene uno **sconto lifetime** (vedi `pricing.md`)

### Quando NON promuovere

Quando il modulo è davvero specifico (es. integra un sistema proprietario di Acme che nessun altro ha). Resta `acme-*` per sempre.

---

## 7. Servizi non-modulari

Cose che si vendono al cliente ma non sono moduli software:

- **Onboarding & Setup** — config iniziale del tenant, primo training (incluso nel setup del primo modulo custom o quotato a parte)
- **Migrazione dati** — da Excel, da gestionale esistente, da altro CRM
- **Training** — formazione utenti per ruolo
- **Consulenza personalizzazione** — analisi processo, design custom fields/workflow (quando i custom fields esisteranno)
- **Sviluppo modulo custom** — il pattern descritto sopra
- **Supporto premium** — SLA forte, account dedicato (sopra il canone base)

---

## 8. Matrice dipendenze (le più importanti)

```
crm-contacts ◄── crm-pipeline ◄── lead-scoring, ai-lead-scoring
             ◄── activities ◄── calendar
             ◄── quotes ◄── orders ◄── invoicing ◄── it-fatturazione-sdi
                                                 ◄── it-conservazione
                                              ◄── subscriptions
warehouse ◄── warehouse-multi, barcode, logistics, production
helpdesk ◄── sla-management, live-chat, customer-portal
projects ◄── time-tracking ◄── invoicing (per fatturare ore)
         ◄── gantt, resource-planning
email-integration ◄── ai-email-summary
hr-employees ◄── hr-attendance, hr-leave, hr-expenses
```

---

## 9. Priorità di sviluppo

Con il modello boutique, **non c'è una "roadmap di sviluppo lineare"** del catalogo. Si costruisce ciò che i clienti pagano, nell'ordine in cui pagano.

### Quello che è già pianificato di sicuro (MVP)

- I 5 moduli core: `crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard` (✅ Fase 3) + `calendar` (✅).
- **Verticali primi clienti (Fase 4.5)**: `quotes` + PDF (T4.20–21), `warehouse` esteso con margini/ordini di vendita (T4.22), `work-orders`/commesse (T4.23), `file-storage` Vercel Blob + allegati (T4.24).

### Ad alta probabilità nei prossimi clienti

In ordine indicativo (basato su quanto è "ovvio" per una PMI italiana):

1. `it-anagrafica-check` — quick win italiano (autocompletamento P.IVA)
2. `invoicing` + `it-fatturazione-sdi` — appena un cliente vuole fatturare (i preventivi ci sono già)
3. `orders` / `production` completi — se le commesse/ordini semplici dell'MVP non bastano
4. `helpdesk` — appena un cliente fa anche customer service

### Da NON costruire (almeno non subito)

- Accounting completo → integrazione con commercialisti
- Microservizi proprietari (storage, search, queue) → usa managed
- Mobile app nativa → PWA se mai serve
- Marketplace di moduli di terzi → non siamo platform-as-a-product
- Workflow engine visuale → caso per caso con moduli custom o Inngest jobs
- Custom fields dinamici → si valutano se 2+ clienti li chiedono
