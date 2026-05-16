# Coordinate — Catalogo Moduli

Catalogo ragionato di tutti i moduli che ha senso costruire su Coordinate. Ogni modulo è una unità autonoma con manifest, modelli, rotte, permessi. La maggior parte dei clienti userà 4-8 moduli; nessun cliente li userà tutti.

## Tassonomia

Ogni modulo appartiene a una **categoria** e a un **livello**:

**Livelli** (determinano il pricing e la priorità di sviluppo):
- **Foundation** — incluso nel core, non vendibile separatamente
- **Core** — moduli base, inclusi nei piani standard
- **Standard** — moduli a pagamento di uso comune
- **Advanced** — moduli specialistici per piani superiori
- **Vertical** — moduli industry-specific (un settore solo)
- **Custom** — moduli sviluppati su misura per un cliente

**Sigle**:
- `[S]` = piccolo (1-2 settimane di sviluppo)
- `[M]` = medio (1-2 mesi)
- `[L]` = grande (3-6 mesi)
- `[XL]` = molto grande (6+ mesi)
- `→` = dipendenza da un altro modulo

---

## 1. Foundation (parte del core)

Componenti fondamentali che ogni cliente ha, non vendibili separatamente. Vivono in `packages/core`.

| Modulo | Cosa fa | Note |
|---|---|---|
| **auth** | Login, sessioni, MFA, password reset, OAuth | Better-Auth |
| **users** | Anagrafica utenti tenant, inviti, deattivazione | |
| **rbac** | Ruoli predefiniti + permessi granulari (CASL) | |
| **tenant-admin** | Pagina settings tenant, branding, abilitazione moduli | |
| **notifications** | Notifiche in-app + email, preferenze utente | Base — il modulo "notifications-advanced" estende |
| **audit-log** | Tracciamento azioni base (login, modifiche critiche) | |
| **file-storage** | Upload, storage S3-compatible, permessi file | |
| **search** | Ricerca globale full-text via Postgres `tsvector` | Indicizza modelli registrati dai moduli |

---

## 2. Core — Moduli CRM base

I moduli che definiscono Coordinate come CRM. Tutti i clienti ne avranno almeno uno.

### `crm-contacts` `[M]` — **Core**
Anagrafica persone e aziende. Relazioni padre-figlio (azienda → persone). Tag, categorie, owner. Dati commerciali, fiscali (P.IVA, CF), contatti multipli.
- Estendibile via custom fields
- Emette eventi: `contact.created`, `contact.updated`, `contact.merged`

### `crm-pipeline` `[M]` — **Core**  
→ `crm-contacts`
Lead e Deal/Opportunità. Pipeline configurabili (stadi custom per tenant). Kanban + tabella. Valore atteso, probabilità, data di chiusura. Conversione lead → cliente.
- Emette eventi: `lead.stage.changed`, `deal.won`, `deal.lost`

### `activities` `[S]` — **Core**
→ `crm-contacts`
Task, chiamate, meeting, note. Vista timeline su contatto. Promemoria via notifications.

### `calendar` `[M]` — **Core**
→ `activities`
Vista calendario settimanale/mensile. Sincronizzazione Google/Outlook (modulo `calendar-sync` separato).

### `dashboard` `[S]` — **Core**
Widget configurabili. KPI standard (lead aperti, fatturato mese, task in scadenza). Per dashboard avanzati custom → `analytics-advanced`.

---

## 3. Standard — Operations & Magazzino

### `warehouse` `[M]` — **Standard**
Prodotti, categorie, prezzi, listini multipli. Stock per deposito singolo. Movimentazioni in/out. Soglie minime con alert.

### `warehouse-multi` `[M]` — **Advanced**  
→ `warehouse`
Multi-deposito, trasferimenti tra depositi, mappatura ubicazioni (corsia/scaffale).

### `barcode` `[S]` — **Advanced**
→ `warehouse`
Lettura barcode (web + mobile camera), stampa etichette, codici EAN/QR.

### `suppliers` `[M]` — **Standard**
Anagrafica fornitori, listini fornitore, condizioni di pagamento, RDA (richiesta d'acquisto), ordini fornitore.

### `production` `[L]` — **Vertical (manifattura)**
→ `warehouse`, `suppliers`
Distinta base (BOM), ordini di produzione, fasi di lavorazione, calcolo costi di produzione. Pesante — solo per manifattura reale.

### `logistics` `[M]` — **Advanced**
→ `warehouse`
Documenti di trasporto (DDT), tracciamento spedizioni, integrazione corrieri (BRT, GLS, SDA, DHL via API).

---

## 4. Standard — Ciclo documentale vendite

### `quotes` `[M]` — **Standard**
→ `crm-contacts`
Preventivi con righe articolo (collegate a `warehouse` se attivo), sconti, condizioni, scadenza. Generazione PDF brandato. Workflow approvazione interno (opzionale).

### `orders` `[M]` — **Standard**
→ `quotes`
Conversione preventivo → ordine cliente. Gestione stato (confermato, in lavorazione, evaso). Allocazione stock se `warehouse` attivo.

### `invoicing` `[L]` — **Advanced**
→ `orders` (opzionale)
Fatture, note di credito, acconti. Numerazione configurabile. Scadenziario, solleciti automatici. **Non include SDI** — quello è modulo separato (`it-fatturazione-sdi`).

### `subscriptions` `[L]` — **Advanced**
→ `invoicing`
Contratti ricorrenti, fatturazione automatica, gestione rinnovi, upgrade/downgrade, prorate. Integrazione Stripe Billing per pagamento automatico.

### `contracts` `[M]` — **Advanced**
→ `crm-contacts`
Repository contratti, scadenze, rinnovi, allegati. Integrabile con firma elettronica (`e-signature`).

---

## 5. Standard — Moduli Italia (must-have per il mercato locale)

Sono il **differenziatore principale** vs competitor globali. Per molti clienti italiani questi moduli sono il motivo dell'acquisto.

### `it-fatturazione-sdi` `[L]` — **Standard**  
→ `invoicing`
Invio fatture al Sistema di Interscambio. Ricezione fatture passive. Notifiche SDI gestite. Integrazione tramite provider (Aruba, Fatture in Cloud API, Notartel, ecc.) — niente accreditamento diretto SDI.
- Probabilmente il modulo a maggior valore percepito per la clientela italiana

### `it-conservazione` `[M]` — **Standard**
→ `it-fatturazione-sdi`
Conservazione sostitutiva a norma (10 anni). Via provider partner (Aruba, InfoCert). Pay-per-document o flat.

### `it-pec` `[S]` — **Standard**
Invio PEC dalla piattaforma. Tracciamento ricevute. Archiviazione comunicazioni PEC su contatti/contratti.

### `it-anagrafica-check` `[S]` — **Standard**
Verifica P.IVA via VIES, recupero dati azienda da P.IVA (provider tipo `openapi.it`, `Cerved`), Codice Fiscale validation. Autocompletamento anagrafica.

### `it-f24` `[M]` — **Vertical (commercialisti)**
Generazione F24 per il cliente. Solo per studi di commercialisti come modulo verticale.

### `it-corrispettivi-elettronici` `[M]` — **Vertical (retail/ristorazione)**
Integrazione corrispettivi telematici per chi non emette fattura ma scontrino.

---

## 6. Advanced — Marketing

### `email-marketing` `[L]` — **Advanced**
Liste, segmenti dinamici, template builder (drag&drop), invio massivo via provider (Resend, SendGrid, Mailgun). Statistiche aperture/click. **Compliance GDPR built-in** (double opt-in, unsubscribe).

### `marketing-automation` `[XL]` — **Advanced**
→ `email-marketing`, `crm-contacts`
Workflow visuali (trigger → condizione → azione). Drip campaigns, nurturing, lead scoring automatico. Complesso — valutare se costruire o integrare (es. embed di un tool esterno).

### `forms-landing` `[M]` — **Advanced**
Form builder, landing page semplici, embed su siti esterni. Lead capture diretta in CRM.

### `lead-scoring` `[M]` — **Advanced**
→ `crm-pipeline`
Regole di punteggio configurabili (apertura email = +5, visita pricing = +10, ecc.). Versione AI in `ai-lead-scoring`.

### `social-publishing` `[M]` — **Vertical (marketing agencies)**
Programmazione post su Facebook, Instagram, LinkedIn. Calendario editoriale. Approvazioni interne.

### `sms-marketing` `[S]` — **Advanced**
Invio SMS marketing. Provider: Twilio, MessageBird, Skebby (italiano).

---

## 7. Advanced — Customer Service

### `helpdesk` `[L]` — **Advanced**
→ `crm-contacts`
Ticket system con stati, assegnazione, priorità, SLA. Email-to-ticket (parsing email entranti). Macro/risposte rapide.

### `knowledge-base` `[M]` — **Advanced**
Articoli con categorie, ricerca, voto utili/non-utili. Interna o pubblica (su sottodominio dedicato).

### `live-chat` `[L]` — **Advanced**
→ `helpdesk`
Widget chat per sito cliente, routing a operatori, transcript salvato come ticket. Bot di pre-qualifica opzionale.

### `customer-portal` `[L]` — **Advanced**
Portale per il cliente finale (non utente del CRM): vede sue fatture, ticket aperti, contratti, può aprire nuovi ticket. White-label sotto sottodominio.

### `sla-management` `[M]` — **Advanced**
→ `helpdesk`
Definizione SLA per cliente/priorità, alert escalation, reporting compliance SLA.

---

## 8. Advanced — Project Management & Time

### `projects` `[L]` — **Advanced**
Progetti, milestone, task strutturati, dipendenze, % completamento.

### `time-tracking` `[M]` — **Advanced**
→ `projects` (opzionale)
Timesheet, timer in-app, fatturabile/non-fatturabile, report ore per cliente/progetto. Esportabile in fattura via `invoicing`.

### `gantt` `[M]` — **Advanced**
→ `projects`
Vista Gantt con drag&drop, baseline, critical path.

### `resource-planning` `[L]` — **Advanced**
→ `projects`
Allocazione risorse umane sui progetti, vista capacity, gestione overbooking.

---

## 9. Advanced — HR

Modulo HR per PMI è un mercato a sé. Valutare se entrarci o restare "lite" e integrarsi con software dedicati (TeamSystem HR, Zucchetti).

### `hr-employees` `[M]` — **Advanced**
Anagrafica dipendenti, organigramma, contratti, scadenze documenti (passaporto, patente, visita medica).

### `hr-attendance` `[L]` — **Advanced**  
→ `hr-employees`
Timbrature (web + mobile + badge fisico), turni, calcolo straordinari. Integrabile con dispositivi fisici (ZKTeco, biometrici).

### `hr-leave` `[M]` — **Advanced**
→ `hr-employees`
Richieste ferie/permessi, workflow approvazione, calendario assenze del team.

### `hr-expenses` `[M]` — **Advanced**
→ `hr-employees`
Note spese con foto scontrino (OCR opzionale), categorie, approvazione, esportazione contabilità.

### `hr-recruiting-ats` `[L]` — **Advanced**
Job posting, candidati, pipeline assunzione, colloqui programmati. Embed form su sito carriere.

### `hr-performance` `[L]` — **Advanced**
Review periodiche, obiettivi (OKR), 360° feedback.

---

## 10. Finance & Accounting

**Decisione strategica importante**: l'accounting completo (registri IVA, libri sociali, dichiarativi) è un mondo enorme (TeamSystem, Zucchetti dominano). Sconsiglio di costruirlo. Costruire invece **pezzi pre-contabili** che si integrano con il commercialista del cliente.

### `cashflow` `[M]` — **Advanced**
Vista cash flow previsto vs effettivo, basato su fatture/scadenze. Categorizzazione entrate/uscite.

### `bank-reconciliation` `[L]` — **Advanced**
Import movimenti bancari (PSD2 / CSV / OFX), matching automatico con fatture, regole di categorizzazione.

### `budget-forecast` `[M]` — **Advanced**
Budget annuale per centro di costo, confronto consuntivo.

### `prima-nota` `[M]` — **Vertical (commercialisti)**
Solo se si vuole entrare nel verticale commercialisti. Altrimenti meglio integrazione.

---

## 11. Document Management & Communication

### `dms` `[M]` — **Advanced**
Cartelle, versioning, permessi granulari sui documenti, ricerca full-text nel contenuto (PDF/Word via Tika).

### `document-templates` `[M]` — **Advanced**
Template Word/PDF con placeholder, generazione documenti da dati CRM (es. contratti precompilati).

### `e-signature` `[M]` — **Advanced**
Firma elettronica via provider (DocuSign, Yousign, Namirial italiana). Pay-per-firma.

### `email-integration` `[L]` — **Advanced**
Sincronizzazione bidirezionale IMAP/Exchange/Gmail. Email logged automaticamente su contatto. Reply dall'interno del CRM.

### `voip-integration` `[M]` — **Advanced**
Click-to-call, log chiamate automatico, popup contatto su chiamata entrante. Provider: Twilio, Vonage, 3CX, Wildix (italiano).

### `whatsapp-business` `[M]` — **Advanced**
Conversazioni WhatsApp Business gestite dentro il CRM. Costi: provider (Meta + intermediario tipo 360dialog) + template messages.

### `sms` `[S]` — **Standard**
Invio SMS transazionali (conferma appuntamento, promemoria scadenza). Provider Skebby/Twilio.

---

## 12. Analytics & BI

### `reports-builder` `[L]` — **Advanced**
Report builder visuale (drag campi → grid/grafici), salva report, condividi. Su dati CRM + custom fields.

### `embedded-bi` `[XL]` — **Advanced**
Embed di Metabase o Apache Superset, multi-tenant aware. Dashboard avanzate, drill-down. Valutare se vale lo sforzo o se basta `reports-builder`.

### `data-export` `[S]` — **Standard**
Export programmati CSV/Excel via email o S3, per integrare con Excel/PowerBI del cliente.

---

## 13. Compliance & Security

### `gdpr-toolkit` `[M]` — **Advanced**
Data export per cliente finale (diritto di portabilità), right-to-be-forgotten (cancellazione cascata), consensi tracciati.

### `sso-saml` `[M]` — **Advanced**
SAML 2.0 + OIDC. Required per enterprise (Microsoft Azure AD, Okta, Google Workspace).

### `audit-log-advanced` `[M]` — **Advanced**
Estende il base `audit-log`: log granulare di ogni modifica, diff campo-per-campo, esportazione, retention configurabile.

### `2fa-mfa` `[S]` — **Foundation**
Già nel core (Better-Auth). Possibile estensione: SMS, hardware key (FIDO2).

### `backup-restore` `[M]` — **Advanced**
Backup on-demand del tenant, restore selettivo (es. ripristina solo i contatti dell'ultima settimana). Solo per piani Business+.

---

## 14. AI & Smart features

Categoria in forte crescita. Da costruire incrementalmente con API LLM (Claude, OpenAI).

### `ai-assistant` `[M]` — **Advanced**
Assistente conversazionale interno: "trovami tutti i lead non contattati da 30 giorni", "riassumi le conversazioni con Acme". Costo variabile API.

### `ai-email-summary` `[S]` — **Advanced**
→ `email-integration`
Riassunto thread email lunghi, suggerimento risposta.

### `ai-lead-scoring` `[M]` — **Advanced**  
→ `crm-pipeline`, `email-marketing`
Scoring lead basato su comportamento, training su dati storici del tenant.

### `ai-content-gen` `[S]` — **Advanced**
Generazione testi: bozze email, risposte ticket, descrizioni prodotto.

### `ai-voice-notes` `[M]` — **Advanced**
→ `activities`
Note vocali su mobile → trascrizione → salvataggio come nota attività.

### `ai-document-extract` `[L]` — **Advanced**
OCR + estrazione strutturata da documenti (fatture passive, scontrini, contratti).

---

## 15. Integrazioni

I connettori sono moduli a tutti gli effetti: ognuno con il suo manifest, le sue rotte di config, i suoi job di sync.

### `integration-zapier-make` `[S]` — **Standard**
Endpoint trigger/action per Zapier e Make. Copre il 90% delle richieste di integrazione "minore".

### `integration-webhooks` `[S]` — **Standard**
Webhook outbound configurabili su eventi tenant.

### `integration-api-public` `[M]` — **Advanced**
API REST pubblica documentata (OpenAPI), token per tenant, rate limiting.

### `integration-teamsystem` `[L]` — **Vertical**
Sync con TeamSystem (anagrafiche, fatture, articoli). Connettore complesso, valore altissimo per clienti già su TS.

### `integration-fattureincloud` `[M]` — **Vertical**
Sync con Fatture in Cloud — gestionale popolare per piccole partite IVA.

### `integration-zucchetti` `[L]` — **Vertical**
Sync con Zucchetti.

### `integration-shopify` `[M]` — **Vertical (e-commerce)**
Sync prodotti, ordini, clienti Shopify ↔ Coordinate.

### `integration-woocommerce` `[M]` — **Vertical (e-commerce)**
Come sopra per WooCommerce.

### `integration-magento` `[L]` — **Vertical (e-commerce)**
Per Magento. Più complesso.

### `integration-prestashop` `[M]` — **Vertical (e-commerce)**
Per PrestaShop.

### `integration-stripe` `[S]` — **Standard**  
→ `invoicing`
Pagamenti carta su fatture, ricorrenti via Stripe Billing.

### `integration-payment-italian` `[M]` — **Standard**
Nexi, Satispay, PayPal, bonifico immediato. Mercato italiano.

### `integration-banks-psd2` `[L]` — **Advanced**  
→ `bank-reconciliation`
Open Banking PSD2 per importare movimenti bancari automaticamente. Provider: Tink, Fabrick, Nordigen/GoCardless.

### `integration-google-workspace` `[M]` — **Standard**
Sync Gmail, Calendar, Drive, Contacts.

### `integration-microsoft365` `[M]` — **Standard**
Sync Outlook, Calendar, OneDrive, Contacts.

---

## 16. Verticali (industry-specific)

Moduli costruiti per un settore preciso. Vendita più chirurgica, prezzo più alto, churn più basso.

### `vertical-studi-professionali` (avvocati, commercialisti, architetti) `[L]`
Pratiche/incarichi, timesheet professionale, parcellazione, scadenzario fiscale.

### `vertical-edilizia` `[XL]`
Cantieri, mezzi, manodopera, SAL, sicurezza (DVR), gestione subappaltatori.

### `vertical-real-estate` `[L]`
Immobili (anagrafica con foto, planimetrie), visite, contratti di locazione, mandati di vendita, sync portali (Immobiliare.it, Idealista).

### `vertical-sanita` `[L]`
Pazienti (con privacy potenziata), agende mediche, cartelle cliniche minime, prescrizioni. Attenzione: requisiti GDPR forti per dati sanitari.

### `vertical-fitness` `[M]`
Iscritti, abbonamenti, prenotazione corsi, gestione istruttori, certificati medici.

### `vertical-wedding-events` `[M]`
Sposi/clienti, fornitori, timeline evento, budget, planning.

### `vertical-automotive` `[L]`
Officina meccanica: parco veicoli cliente, scadenze tagliando/revisione, preventivi lavorazioni, ricambi.

### `vertical-ristorazione` `[L]`
Prenotazioni tavoli, gestione menù, allergeni, ordini fornitori, food cost.

### `vertical-hotel-bb` `[L]`
Prenotazioni camere, channel manager (Booking, Airbnb), check-in/out, comunicazione alloggiati (questura).

---

## 17. Custom — moduli su misura (Tier 4)

Vivono in `tenants/<slug>/modules/`. Esempi reali tipici:
- Modulo "Gestione Flotta" per un cliente di logistica
- "Calendario Lavorazioni Macchine CNC" per un cliente metalmeccanico
- "Cruscotto Filiali" per un cliente retail con 50 punti vendita
- Integrazione bespoke con un gestionale proprietario del cliente

Pattern raccomandato: parte come Tier 4 (custom), se 3+ clienti ne hanno bisogno → si promuove a modulo standard nel catalogo.

---

## 18. Servizi non-modulari

Cose che si vendono al cliente ma non sono moduli software:

- **Onboarding & Setup** — config iniziale, primo training
- **Migrazione dati** — da Excel, da gestionale esistente, da altro CRM
- **Training** — formazione utenti (per ruolo)
- **Consulenza personalizzazione** — analisi processo, design custom fields/workflow
- **Sviluppo modulo custom** — Tier 4
- **Supporto premium** — SLA, account manager dedicato
- **Deploy dedicato** — istanza separata per cliente enterprise
- **White-label** — rebrand della piattaforma
- **Manutenzione modulo custom** — manutenzione evolutiva di un modulo Tier 4

---

## 19. Matrice dipendenze (le più importanti)

```
crm-contacts ◄── crm-pipeline ◄── lead-scoring
                              ◄── ai-lead-scoring
crm-contacts ◄── activities ◄── calendar
crm-contacts ◄── quotes ◄── orders ◄── invoicing ◄── it-fatturazione-sdi
                                                  ◄── it-conservazione
                                              ◄── subscriptions
warehouse ◄── warehouse-multi
          ◄── barcode
          ◄── logistics
          ◄── production
helpdesk ◄── sla-management
         ◄── live-chat
         ◄── customer-portal
projects ◄── time-tracking ◄── invoicing (per fatturare ore)
         ◄── gantt
         ◄── resource-planning
email-integration ◄── ai-email-summary
hr-employees ◄── hr-attendance, hr-leave, hr-expenses
```

---

## 20. Roadmap di sviluppo suggerita

In ordine di valore atteso × velocità di sviluppo:

### Wave 1 — MVP vendibile (3-4 mesi)
1. Foundation completa
2. `crm-contacts`, `crm-pipeline`, `activities`, `dashboard`, `calendar`
3. `warehouse` (base)
4. `quotes`, `orders`
5. `it-anagrafica-check` (P.IVA / CF) — quick win italianizzazione

### Wave 2 — Tier "Standard" venduto (mesi 4-7)
6. `invoicing`
7. `it-fatturazione-sdi` — il differenziatore italiano
8. `helpdesk` base
9. `email-integration`
10. `integration-zapier-make`, `integration-webhooks`
11. `data-export`
12. `it-pec`

### Wave 3 — Tier "Business" (mesi 7-12)
13. `marketing-email`
14. `customer-portal`
15. `reports-builder`
16. `time-tracking` + `projects` base
17. `e-signature`
18. `subscriptions`
19. `integration-stripe`, `integration-google-workspace`, `integration-microsoft365`
20. `gdpr-toolkit`, `sso-saml`, `audit-log-advanced`

### Wave 4 — AI + Verticali (anno 2)
21. `ai-assistant`, `ai-content-gen`, `ai-email-summary`
22. Primi 1-2 verticali in base ai clienti acquisiti
23. `integration-teamsystem` o `integration-fattureincloud` in base ai clienti

### Wave 5 — Espansione (anno 2+)
24. HR completo
25. Marketing automation visuale
26. BI embedded
27. Verticali aggiuntivi

### Da NON costruire (almeno non subito)
- Accounting completo → integrazione con commercialisti
- Microservizi proprietari (storage, search, queue) → usa managed
- Mobile app nativa → PWA fino a quando non c'è domanda forte
- Marketplace di moduli di terzi → solo dopo 50+ tenant attivi
