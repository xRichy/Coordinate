# Coordinate — Pricing & Listino

> **Disclaimer importante**: i prezzi in questo documento sono **orientativi**, basati su benchmark del mercato italiano SMB CRM (HubSpot, Pipedrive, Zoho, TeamSystem CRM in Cloud, Bitrix24). Tutti i prezzi sono **netti IVA esclusa (22%)**, in Euro. Vanno **validati con i prospect reali** prima di pubblicarli: a 5 clienti scontenti dal prezzo, abbassi; a 0 obiezioni sul prezzo, alzi.

---

## 1. Filosofia di pricing

Quattro principi guida:

1. **Tier + Add-on, non puro à la carte**. I clienti odiano i configuratori complessi. Diamo 4 tier preconfezionati con moduli inclusi, poi add-on per espandere. Il cliente vede subito "quanto pago" senza fare una somma di 12 voci.
2. **Per-user/month come unità base**. Standard del settore, facile da capire, scala con la dimensione del cliente. Annual billing con sconto per cassa.
3. **Custom è un mondo a parte**. Sviluppo bespoke (Tier 4) si quota a parte, mai a listino, sempre con SOW (Statement of Work).
4. **Tre modelli commerciali, una sola architettura**. Lo stesso software si vende in tre modi: **subscription SaaS** (default), **Lifetime License + Cloud Care** (una tantum + canone supporto/hosting), **On-premise** (per enterprise). Il cliente sceglie quello che si adatta al suo CFO; tu non rifai il software tre volte.

---

## 2. I tre modelli commerciali

Il cliente sceglie **uno** dei tre modelli all'acquisto. Una volta scelto, può cambiarlo solo a fine anno contrattuale (con regole di conversione documentate nel contratto).

### Modello A — Subscription SaaS (default, raccomandato per il 70% dei clienti)

```
COSTO_MENSILE = (tier × n_utenti) + Σ(add-on × n_utenti) + flat_addons + usage_fees
```

Tutto OPEX, paghi mese per mese, lock-in basso, cancellabile. È quello su cui costruiremo l'80% del fatturato perché scala meglio, ha churn più gestibile e dà visibilità su MRR (Monthly Recurring Revenue) — la metrica che conta per investitori e valutazione.

→ Dettagli completi nelle **sezioni 3–13**.

### Modello B — Lifetime License + Cloud Care (CAPEX upfront + canone ridotto)

```
ANNO_1            = (licenza_tier × n_utenti) + Σ(licenza_modulo × n_utenti) + setup
RICORRENTE_MENSILE = cloud_care × n_utenti + flat_addons + usage_fees
```

Cliente paga la **licenza una tantum** (CAPEX), poi un canone mensile ridotto **obbligatorio** per hosting, supporto e aggiornamenti. Il cliente "possiede" la licenza in perpetuo. Break-even rispetto al SaaS ≈ 4-5 anni: chi resta a lungo paga meno totale, chi se ne va prima ha pagato di più.

Pensato per **clienti italiani vecchia scuola** che ragionano "compro il gestionale, poi pago la manutenzione" — la mentalità TeamSystem/Zucchetti/Mexal.

→ Dettagli completi nelle **sezioni 14–17**.

### Modello C — On-premise (solo Enterprise)

```
ANNO_1            = licenza_on_premise × n_utenti + installation + primo_canone
RICORRENTE_ANNO  = care_on_premise × n_utenti
```

Cliente installa il software sui **propri server** (cloud privato, datacenter, in-house). Noi vendiamo licenza, codice eseguibile, aggiornamenti, supporto remoto. L'hosting è a carico del cliente. Per enterprise con compliance forte (PA, sanità, finanza, difesa) o sovranità dati.

→ Dettagli completi nella **sezione 18**.

### Voci una tantum (comuni a tutti e tre i modelli)

- Setup / onboarding
- Migrazione dati
- Sviluppo custom (Tier 4)
- Training aggiuntivo

### Voci ricorrenti opzionali (comuni a tutti e tre i modelli)

- SLA premium / supporto dedicato
- Storage aggiuntivo
- Deploy dedicato (B e C)
- Consumi a unità (SDI, SMS, AI, firma elettronica)

---

# Parte I — Modello "Subscription SaaS"

## 3. Tier preset

### 🟦 Starter — €19/utente/mese (annuale: €15/utente/mese, –21%)

Per **studi piccoli e freelance** (3–10 utenti) che cominciano a strutturare il commerciale.

**Incluso**:
- `crm-contacts`, `crm-pipeline`, `activities`, `calendar`, `dashboard` (base)
- 5 GB storage / utente
- Email support (risposta < 48h)
- Mobile-friendly web (no app nativa)
- Branding base (logo, colore primario)
- 5 custom fields per entità
- Aggiornamenti automatici della piattaforma

**Limiti**:
- 10 utenti massimo
- 5.000 contatti
- 1 pipeline vendite
- No API
- No SDI, no fatturazione

### 🟩 Professional — €39/utente/mese (annuale: €32/utente/mese, –18%)

Per **PMI commerciali** (10–50 utenti) che hanno bisogno del ciclo documentale completo.

**Incluso** (tutto Starter +):
- `warehouse` (base, mono-deposito)
- `quotes`, `orders`
- `helpdesk` (base)
- `email-marketing` (max 10.000 invii/mese)
- `customer-portal` (base)
- `data-export`, `integration-zapier-make`, `integration-webhooks`
- `it-anagrafica-check` (verifica P.IVA/CF)
- `reports-builder` (base, max 20 report salvati)
- 25 GB storage / utente
- Chat support (risposta < 8h lavorative)
- Custom fields illimitati
- Pipeline multiple

**Limiti**:
- 50 utenti massimo
- 50.000 contatti
- No SDI (add-on)
- API limit 10k req/giorno

### 🟧 Business — €69/utente/mese (annuale: €58/utente/mese, –16%)

Per **aziende strutturate** (50+ utenti) che vogliono workflow, fatturazione SDI, automazioni.

**Incluso** (tutto Professional +):
- `invoicing` + `it-fatturazione-sdi` (SDI illimitato incluso)
- `subscriptions`
- `it-pec` (no canone PEC, solo integrazione)
- `email-integration`
- `e-signature` (50 firme/mese incluse)
- `audit-log-advanced`, `gdpr-toolkit`, `sso-saml`
- `integration-stripe`, `integration-google-workspace`, `integration-microsoft365`
- Workflow engine (Tier 3 personalizzazioni)
- API illimitate
- 100 GB storage / utente
- Priority support (risposta < 4h lavorative)
- 99.5% uptime SLA

**Limiti**:
- Contatti illimitati
- Storage extra a €1/GB/mese oltre soglia

### 🟥 Enterprise — Quotazione personalizzata (indicativa: da €120/utente/mese)

Per **clienti grandi o regolamentati** che vogliono moduli custom, isolamento, SLA forti.

**Incluso** (tutto Business +):
- Sviluppo moduli custom (Tier 4) inclusi nel contratto
- Deploy dedicato (DB e/o infrastruttura)
- White-label opzionale
- SLA 99.9% con penali contrattuali
- Account manager dedicato
- Onboarding white-glove (incluso, no fee)
- Audit di sicurezza / DPIA su richiesta
- Backup giornalieri con retention 90gg
- Storage illimitato
- Supporto telefonico 24/5 (o 24/7 con upgrade)

---

## 4. Tabella comparativa tier

| Funzionalità | Starter | Professional | Business | Enterprise |
|---|:-:|:-:|:-:|:-:|
| Prezzo / utente / mese (annuale) | €15 | €32 | €58 | da €100 |
| Utenti max | 10 | 50 | ∞ | ∞ |
| Contatti | 5k | 50k | ∞ | ∞ |
| Storage / utente | 5 GB | 25 GB | 100 GB | ∞ |
| Pipeline vendite | 1 | ∞ | ∞ | ∞ |
| CRM + Tasks | ✅ | ✅ | ✅ | ✅ |
| Magazzino base | ❌ | ✅ | ✅ | ✅ |
| Preventivi / Ordini | ❌ | ✅ | ✅ | ✅ |
| Helpdesk base | ❌ | ✅ | ✅ | ✅ |
| Email marketing | ❌ | ✅ (10k/m) | ✅ (50k/m) | ✅ (∞) |
| Fatturazione + SDI | ❌ | ❌ | ✅ | ✅ |
| Workflow / automazioni | ❌ | ❌ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ✅ | ✅ |
| API illimitate | ❌ | ❌ | ✅ | ✅ |
| Moduli custom | ❌ | ❌ | ❌ | ✅ |
| Deploy dedicato | ❌ | ❌ | ❌ | ✅ |
| SLA contrattuale | ❌ | ❌ | 99,5% | 99,9% |
| Account manager | ❌ | ❌ | ❌ | ✅ |
| Support | Email 48h | Chat 8h | Priority 4h | 24/5 dedicato |

---

## 5. Add-on (à la carte, sopra ogni tier)

Prezzi mensili. Annual –15% su tutti.

### Moduli aggiuntivi (per utente/mese)

| Add-on | Starter | Pro | Business | Note |
|---|:-:|:-:|:-:|---|
| `warehouse-multi` | n/d | €8 | €6 | Multi-deposito, trasferimenti |
| `barcode` | n/d | €4 | €3 | Lettore + stampa etichette |
| `suppliers` | n/d | €6 | €5 | Anagrafica fornitori + RDA |
| `production` (BOM) | n/d | n/d | €15 | Manifattura |
| `logistics` | n/d | €8 | €6 | DDT, integrazione corrieri |
| `it-fatturazione-sdi` | n/d | €12 | inclusa | SDI |
| `it-conservazione` | €3 | €3 | €2 | Conservazione 10 anni |
| `marketing-automation` | n/d | n/d | €18 | Workflow visuali |
| `forms-landing` | €5 | €4 | €3 | Form & landing |
| `lead-scoring` | n/d | €5 | €4 | Regole scoring |
| `live-chat` | n/d | €8 | €6 | Chat su sito |
| `sla-management` | n/d | n/d | €5 | SLA helpdesk |
| `projects` | n/d | €10 | €8 | Project mgmt |
| `time-tracking` | €5 | €4 | €3 | Richiede projects |
| `gantt` | n/d | €5 | €4 | Vista Gantt |
| `resource-planning` | n/d | n/d | €8 | Capacity planning |
| `hr-employees` | n/d | €8 | €6 | Anagrafica HR |
| `hr-attendance` | n/d | €10 | €8 | Timbrature |
| `hr-leave` | n/d | €4 | €3 | Ferie/permessi |
| `hr-expenses` | n/d | €5 | €4 | Note spese |
| `hr-recruiting-ats` | n/d | n/d | €10 | ATS |
| `cashflow` | n/d | €6 | €5 | Cash flow |
| `bank-reconciliation` | n/d | n/d | €12 | + PSD2 a parte |
| `dms` | €6 | €5 | €4 | Document mgmt |
| `e-signature` | n/d | €5 | inclusa* | * 50 firme/m incluse, oltre a consumo |
| `email-integration` | n/d | €6 | inclusa | Gmail/Outlook bidirez. |
| `voip-integration` | n/d | €15 | €12 | Click-to-call |
| `whatsapp-business` | n/d | n/d | €20 | + costi Meta |
| `reports-builder` (avanzato) | n/d | €8 | inclusa | Report builder |
| `embedded-bi` | n/d | n/d | €25 | Metabase embed |
| `ai-assistant` | n/d | n/d | €18 | + consumo API |
| `ai-content-gen` | n/d | €8 | €6 | + consumo |
| `ai-email-summary` | n/d | n/d | €6 | + consumo |
| `ai-lead-scoring` | n/d | n/d | €12 | + training |
| `backup-restore` (on-demand) | n/d | n/d | €4 | Backup avanzati |

### Moduli verticali (per utente/mese)

| Verticale | Prezzo | Tier minimo |
|---|:-:|---|
| `vertical-studi-professionali` | €15 | Pro |
| `vertical-edilizia` | €25 | Business |
| `vertical-real-estate` | €18 | Pro |
| `vertical-sanita` | €22 | Business (GDPR) |
| `vertical-fitness` | €12 | Pro |
| `vertical-wedding-events` | €12 | Pro |
| `vertical-automotive` | €18 | Pro |
| `vertical-ristorazione` | €15 | Pro |
| `vertical-hotel-bb` | €20 | Business |

### Connettori / Integrazioni (flat/mese, indipendente da n. utenti)

| Integrazione | Setup | Mensile |
|---|:-:|:-:|
| `integration-teamsystem` | €1.500 | €120/mese |
| `integration-zucchetti` | €1.800 | €150/mese |
| `integration-fattureincloud` | €300 | €30/mese |
| `integration-shopify` | €400 | €40/mese per store |
| `integration-woocommerce` | €400 | €30/mese per store |
| `integration-magento` | €1.200 | €80/mese per store |
| `integration-prestashop` | €600 | €40/mese per store |
| `integration-banks-psd2` | €500 | €25/mese + €0,15/transazione |
| `integration-payment-italian` (Nexi/Satispay/PayPal) | €0 | inclusa* |
| `integration-api-public` | €0 | inclusa in Business |

### Servizi a consumo

| Servizio | Costo | Note |
|---|---|---|
| Invii SDI extra (sopra inclusi) | €0,15 / fattura | Solo per Pro con add-on |
| Conservazione sostitutiva | €0,12 / documento | Pass-through provider |
| Firme elettroniche extra | €1,50 / firma semplice — €4 / firma qualificata | Oltre soglia inclusa |
| Email marketing extra | €1 / 1.000 invii | Sopra soglia tier |
| SMS | €0,06 / SMS Italia — €0,12 estero | |
| WhatsApp Business messaging | €0,08–0,15 / conversazione | Variabile per template |
| AI API consumption | Pass-through + 30% margine | Trasparente |
| Storage extra | €1 / GB / mese | Oltre soglia tier |
| Backup extra retention | €2 / GB / mese | Per retention > 90gg |
| Utenti aggiuntivi temporanei | Pro-rated mensile | Es. stagionali |

---

## 6. Servizi (una tantum)

### Onboarding

| Pacchetto | Prezzo | Cosa include |
|---|:-:|---|
| **Self-service** | €0 | Documentazione, video tutorial, free trial 14gg |
| **Quick Start** | €0 (incluso Pro+) | 1 call 90 min di setup guidato |
| **Onboarding Standard** | €750 | 1 call kick-off + config moduli + 2 sessioni training (2h cad) |
| **Onboarding Premium** | €2.500 | Quick Start + 5 sessioni training + setup workflow + 2 mesi di affiancamento |
| **Onboarding Enterprise** | incluso | Project plan dedicato, 4-8 settimane, account manager |

### Migrazione dati

| Origine | Prezzo |
|---|---|
| Excel / CSV (mapping standard) | €500 (fino a 10k record) |
| Excel / CSV (mapping complesso) | €1.500 – €4.000 (a preventivo) |
| Migrazione da altro CRM (HubSpot, Salesforce, Zoho, Pipedrive) | €2.500 – €8.000 |
| Migrazione da gestionale (TeamSystem, Zucchetti) | €4.000 – €15.000 |
| Migrazione di dati transazionali storici (fatture, movimenti) | a preventivo, dipende dal formato |

### Training

| Pacchetto | Prezzo |
|---|---|
| Sessione singola (2h, remoto) | €280 |
| Giornata full (8h, remoto) | €900 |
| Giornata full on-site (Italia) | €1.400 + trasferte |
| Pacchetto Power User (5 sessioni 2h) | €1.250 |
| Train-the-trainer (cliente forma i suoi) | €1.800 (2 giorni) |
| Workshop personalizzazione (cliente + nostro consulente) | €1.500 / giorno |

---

## 7. Sviluppo custom (Tier 4)

Sempre **a preventivo**. Niente prezzi a listino su questo. Rate card interno:

| Profilo | Tariffa / giorno |
|---|---|
| Junior developer | €450 |
| Senior developer | €750 |
| Tech lead / Solution architect | €950 |
| Product designer (UX/UI) | €600 |
| Project manager | €700 |

### Pacchetti tipo (ordine di grandezza per offrire al cliente)

| Tipo intervento | Stima | Esempio |
|---|---|---|
| Custom field complesso (con validazione, ricerca) | €200 – €800 | "Campo IBAN validato con check CIN" |
| Workflow personalizzato | €300 – €2.000 / cad | "Quando fattura non pagata da 30gg, manda email + crea task" |
| Report custom | €500 – €2.500 | "Marginalità per agente, per cliente, per mese" |
| Integrazione custom (API REST esistente) | €3.000 – €15.000 | "Sync prodotti con ERP proprietario del cliente" |
| Integrazione custom (sistema legacy / SOAP / file) | €8.000 – €30.000 | "Sync con AS/400 del cliente" |
| Modulo custom piccolo | €6.000 – €15.000 | "Gestione contratti di noleggio" |
| Modulo custom medio | €18.000 – €50.000 | "Gestione cantieri e SAL" |
| Modulo custom grande | €60.000 – €150.000+ | "ERP custom per settore verticale" |
| Migrazione enterprise complessa | €15.000 – €60.000 | + giornate dedicate |

### Manutenzione modulo custom

Una volta consegnato un modulo Tier 4:
- **Manutenzione correttiva** (bug fix): inclusa per 90 giorni post-rilascio, poi **€350/mese** o pay-per-fix (€600 / intervento medio)
- **Manutenzione evolutiva**: a tempo & materiale (rate card sopra) o pacchetto a monte ore (–10% prepagando 40h)

### Note contrattuali Tier 4

- **SOW obbligatorio** (Statement of Work) firmato prima dell'inizio
- **30% upfront, 40% a metà milestone, 30% al collaudo**
- Cliente ha 15 giorni per il collaudo, dopo si considera accettato
- IP del codice custom: **mantenuto da Coordinate**, cliente ha licenza d'uso illimitata sul suo tenant. Se il modulo viene promosso a standard nel catalogo, il cliente che l'ha co-finanziato ha **diritto a uno sconto del 20% lifetime su quel modulo**.

---

## 8. Sconti e promozioni

| Tipo | Sconto | Note |
|---|---|---|
| Pagamento annuale | 15–21% (vedi tabella tier) | Singolo invoice, 12 mesi |
| Pagamento biennale | 25% | Con vincolo |
| Volume 25+ utenti | –5% sul listino utenti | Cumulabile con annuale |
| Volume 50+ utenti | –10% | |
| Volume 100+ utenti | –15% | |
| Volume 250+ utenti | –20% (a trattativa) | |
| Non-profit / ONLUS | –25% | Verifica registrazione |
| Startup (< 3 anni, < 50 dipendenti) | –30% primo anno | Prova con Camera Commercio |
| Partner referral (chi porta cliente) | –30% al cliente primo anno + 15% commissione al partner | |
| Migrazione da competitor | 3 mesi gratis | Su contratto annuale |
| Conferma a fine trial entro 7gg | 1 mese gratis | |

**Regola d'oro**: massimo 2 sconti cumulabili. Eccezioni le decide il founder.

---

## 9. Trial e politica di pagamento

- **Free trial**: 14 giorni Professional, no carta richiesta
- **Estensione trial**: fino a 30 giorni su richiesta (sales-qualified)
- **Pagamento**:
  - **Mensile**: carta (Stripe) — addebito automatico
  - **Annuale**: carta o bonifico (banca italiana, IBAN su fattura)
  - **Enterprise**: bonifico con termini negoziabili (30/60gg)
- **Cancellazione**:
  - Mensile: in qualsiasi momento, effetto a fine periodo
  - Annuale: niente rimborso pro-rata salvo casi straordinari
- **Export dati garantito** per 60 giorni dopo cancellazione (poi cancellati definitivamente per GDPR)
- **Aumenti prezzo**: comunicati con 60gg di anticipo, mai sul tier già contrattualizzato per la durata residua

---

## 10. Esempi di preventivo per cliente tipo

### Esempio 1 — Studio di consulenza, 5 persone

**Profilo**: 5 consulenti, lavorano su progetti, fatturano a tempo, vogliono CRM + gestione progetti.

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Tier Professional (annuale) | 5 utenti | €32/m | **€160/mese** |
| Add-on `projects` | 5 | €10/m | €50/mese |
| Add-on `time-tracking` | 5 | €4/m | €20/mese |
| **Totale ricorrente** | | | **€230/mese** = €2.760/anno |
| Onboarding Standard | una tantum | €750 | €750 |
| **Anno 1 totale** | | | **€3.510 + IVA** |

### Esempio 2 — PMI commerciale con magazzino, 20 persone

**Profilo**: ditta che vende prodotti B2B, magazzino, ciclo preventivo→fattura, vuole SDI.

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Tier Business (annuale) | 20 utenti | €58/m | **€1.160/mese** |
| Add-on `warehouse-multi` | 20 | €6/m | €120/mese |
| Add-on `barcode` | 20 | €3/m | €60/mese |
| Add-on `suppliers` | 20 | €5/m | €100/mese |
| Sconto volume 25+ utenti | — | — | n/d (sotto soglia) |
| **Totale ricorrente** | | | **€1.440/mese** = €17.280/anno |
| Onboarding Premium | una tantum | €2.500 | €2.500 |
| Migrazione anagrafiche da Excel | una tantum | €1.200 | €1.200 |
| **Anno 1 totale** | | | **€20.980 + IVA** |

### Esempio 3 — Azienda servizi 60 persone, multi-sede

**Profilo**: agenzia/società di servizi B2B, helpdesk attivo, marketing strutturato, vuole SSO.

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Tier Business (annuale) | 60 utenti | €58/m | **€3.480/mese** |
| Sconto volume 50+ (–10%) | | | **–€348/mese** |
| Add-on `marketing-automation` | 60 | €18/m | €1.080/mese |
| Add-on `live-chat` | 60 | €6/m | €360/mese |
| Add-on `sla-management` | 60 | €5/m | €300/mese |
| Add-on `voip-integration` | 60 | €12/m | €720/mese |
| Integrazione `teamsystem` (flat) | 1 | €120/m | €120/mese |
| **Totale ricorrente** | | | **€5.712/mese** = €68.544/anno |
| Setup TeamSystem | una tantum | €1.500 | €1.500 |
| Onboarding Premium | una tantum | €2.500 | €2.500 |
| Migrazione da HubSpot | una tantum | €5.500 | €5.500 |
| Training Power User (×3 team) | | €1.250 × 3 | €3.750 |
| **Anno 1 totale** | | | **€81.794 + IVA** |

### Esempio 4 — Enterprise con modulo custom, 120 utenti

**Profilo**: logistica con 120 utenti, vuole modulo "Gestione Flotta" custom, deploy dedicato.

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Tier Enterprise (negoziato) | 120 utenti | €105/m (sconto volume incluso) | **€12.600/mese** |
| Deploy dedicato | flat | €450/m | €450/mese |
| Manutenzione modulo custom | flat | €350/m | €350/mese |
| **Totale ricorrente** | | | **€13.400/mese** = €160.800/anno |
| Sviluppo modulo "Gestione Flotta" | one-shot | €38.000 | €38.000 |
| Onboarding Enterprise | incluso | €0 | €0 |
| Migrazione complessa | one-shot | €18.000 | €18.000 |
| Training white-glove | incluso | €0 | €0 |
| Audit di sicurezza | one-shot | €3.500 | €3.500 |
| **Anno 1 totale** | | | **€220.300 + IVA** |
| **Anno 2 ricorrente** | | | **€160.800/anno** |

---

## 11. Listino "pubblico" (da esporre sul sito)

Versione semplificata, **senza i prezzi dei singoli moduli** (su richiesta): si mostra solo i tier + 1-2 add-on iconici.

### Pagina /pricing del sito

```
            STARTER          PROFESSIONAL       BUSINESS           ENTERPRISE
            €15/utente/m     €32/utente/m       €58/utente/m       Su misura
            
            Fatturato        Fatturato          Fatturato          
            annualmente      annualmente        annualmente        
            
            [Inizia gratis]  [Inizia gratis]    [Inizia gratis]    [Parla con noi]
            
            ✓ CRM completo   ✓ Tutto Starter +  ✓ Tutto Pro +      ✓ Tutto Business +
            ✓ Pipeline       ✓ Magazzino        ✓ Fatt. elett. SDI ✓ Moduli su misura
            ✓ Task           ✓ Preventivi       ✓ Subscriptions    ✓ Deploy dedicato
            ✓ Calendario     ✓ Helpdesk         ✓ Workflow engine  ✓ SLA 99.9%
            ✓ Dashboard      ✓ Email marketing  ✓ SSO / SAML       ✓ Account manager
            ✓ App mobile     ✓ Customer portal  ✓ API illimitate   ✓ White-label
            ✓ Email support  ✓ Chat support     ✓ Priority support ✓ Supporto 24/5
            
            Max 10 utenti    Max 50 utenti      Utenti illimitati  Utenti illimitati
            5k contatti      50k contatti       Contatti ∞         Contatti ∞
            5GB / utente     25GB / utente      100GB / utente     Storage ∞
            
            [Confronta tutti i piani]
```

### Sezione "Add-on" (sotto)

Mostra solo le 6-8 categorie più richieste con prezzo "da":

> **Potenzia il tuo Coordinate con i moduli che ti servono**
> - 📦 Magazzino avanzato — *da €6/utente/mese*
> - 🧾 Fatturazione Elettronica SDI — *da €12/utente/mese*
> - 📈 Marketing Automation — *€18/utente/mese*
> - 🎯 Project Management — *da €8/utente/mese*
> - 👥 HR & Presenze — *da €6/utente/mese*
> - 🤖 AI Assistant — *€18/utente/mese*
> - 📲 WhatsApp Business — *€20/utente/mese*
> - 🔌 Integrazione TeamSystem — *€120/mese*
>
> [Vedi tutti i 40+ moduli]

### Sezione "Servizi" (sotto)

> **Ti aiutiamo a partire bene**
> - **Onboarding Standard** — €750 — Setup guidato + 2 sessioni di training
> - **Migrazione dati** — da €500 — Portiamo i tuoi dati da Excel o altri CRM
> - **Sviluppo su misura** — Su preventivo — Costruiamo per te i moduli che ti servono

### FAQ pricing tipiche da includere

- Posso cambiare tier dopo? *Sì, in qualsiasi momento. Upgrade immediato, downgrade a fine periodo.*
- Cosa succede se supero i limiti del tier? *Ti avvisiamo prima. Nessun blocco improvviso.*
- I prezzi sono IVA inclusa? *No, sono netti IVA esclusa (22% per clienti italiani con P.IVA, 0% per estero UE con VIES, secondo normativa).*
- Posso usare la mia carta aziendale? *Sì, Stripe accetta tutte le carte aziendali principali.*
- Bonifico bancario? *Sì per piani annuali e Enterprise.*
- C'è una commissione di uscita? *No, mai. Esporti i tuoi dati e te ne vai quando vuoi.*

---

## 12. Note operative interne

- **Sconti massimi che un sales può autorizzare senza founder**: 10% (–15% in caso di pagamento upfront annuale). Sopra serve sign-off.
- **Quote più di 12 mesi**: solo Enterprise, sempre con clausola di indicizzazione (es. ISTAT FOI –75%).
- **Reverse trial**: per clienti grandi, considerare 30-60gg in Pro/Business per dimostrare valore prima della firma.
- **Listino aggiornato annualmente** a inizio anno fiscale (gennaio). Aumenti vanno comunicati ai clienti esistenti con 60gg di anticipo, ma il prezzo originale è garantito per la durata del contratto annuale in corso.
- **Cliente che paga mensile da 12+ mesi**: proporre passaggio annuale con sconto incentive (+1 mese gratis).
- **Churn risk signals**: monitorare adozione moduli, frequenza login. Se cala, account manager fa outreach prima del rinnovo.

---

## 13. Calcolatore mentale rapido per il sales

Per dare una stima al volo a un prospect:

```
PMI generica 10-20 utenti, ciclo commerciale completo
→ Tier Pro × n + 30% di add-on (warehouse, helpdesk avanzato, projects)
→ ≈ €45 × n_utenti / mese

PMI 30-50 utenti, vogliono fatturazione + workflow
→ Tier Business × n + 20% di add-on
→ ≈ €70 × n_utenti / mese

Cliente che chiede modulo custom
→ Sempre Tier Business o Enterprise minimo
→ Modulo custom da €15k in su, anno 1 ≈ 2.5x ricorrente anno 2
```

> Se il prospect ti dice "ho budget di €X" e X / n_utenti / 12 < €30, è probabilmente un cliente Starter. Sotto €15, non è il nostro cliente — meglio rimandarlo a Zoho o Bitrix24.

---

# Parte II — Modello "Lifetime License + Cloud Care"

## 14. Quando offrire il modello Lifetime

Pensato per clienti che:
- Hanno **budget CAPEX disponibile** (fine anno fiscale, fondi PNRR, contributi camera di commercio, bandi regionali)
- Vogliono "**possedere**" lo strumento, non "affittarlo"
- Hanno mentalità da **gestionale italiano tradizionale** (TeamSystem, Zucchetti, Mexal — comprano licenze + canone manutenzione)
- Prevedono di **usare il software a lungo** (5+ anni)
- Non vogliono un OPEX ricorrente alto per ragioni di bilancio (es. partite IVA che preferiscono ammortizzare in 3-5 anni)

### Quando NON offrirlo

- **Cliente Starter o piccolo/incerto**: rischio churn troppo alto — incassi cash ma perdi cliente che ti farebbe meglio in SaaS
- **Cliente con scarsa solidità finanziaria** o anzianità < 2 anni
- **Startup early stage**: preferiscono e devono preferire OPEX
- Cliente che **non capisce la differenza**: spiegagliela, ma se è confuso, vai in SaaS senza esitare

### Tradeoff per Coordinate

| Pro | Contro |
|---|---|
| Cash flow positivo subito (utile primi anni) | MRR più basso → valutazione VC peggiore |
| ARPU iniziale alto | Aggiornamenti vanno fatti comunque, anche se cliente è "fermo" |
| Cliente più "committed" psicologicamente | Più complesso da gestire (versioning licenze, audit) |
| Riduce churn percepito (il cliente "ce l'ha pagato") | Reverse: rende difficile far rilevare aumenti tariffari |
| Bene per fatturato anno 1 (vendita stagionale) | Crea aspettativa di "proprietà" che a volte sconfina in pretese |

### Tradeoff per il cliente

| Pro | Contro |
|---|---|
| Costo totale 5 anni leggermente inferiore al SaaS puro | Esborso iniziale molto alto |
| Spesa CAPEX deducibile/ammortizzabile | Se cambia idea entro 2 anni, ha pagato di più |
| Mentalità di "possesso" rassicurante | Resta comunque dipendente dal Cloud Care per gli aggiornamenti |
| Compatibile con bandi/finanziamenti (asset acquistabile) | Major version upgrade scontati ma non gratis |

---

## 15. Listino licenze perpetue (una tantum)

### Per tier — licenza una tantum / utente

| Tier | Licenza una tantum / utente | Mesi equivalenti SaaS |
|---|---:|---:|
| Starter | **€390** | ≈ 26 mesi @ €15/m |
| Professional | **€890** | ≈ 28 mesi @ €32/m |
| Business | **€1.490** | ≈ 26 mesi @ €58/m |
| Enterprise | Quotazione (indicativo: da **€2.500/utente**) | a trattativa |

Rationale: la licenza vale circa **25–28 mesi** di subscription equivalente. Il break-even col SaaS arriva tra il 4° e il 5° anno (vita media di un sistema in PMI italiana). Cliente che resta più di 5 anni → risparmia. Sotto i 4 anni → avrebbe pagato meno in SaaS.

### Sconto volume sulla licenza una tantum

| Utenti | Sconto |
|---|---:|
| 25+ | –10% |
| 50+ | –15% |
| 100+ | –20% |
| 250+ | a trattativa, fino a –30% |

### Cosa è incluso nella licenza perpetua

- Diritto d'uso **illimitato nel tempo** del software del tier acquistato, per il numero di utenti acquistato, su una sola installazione (un tenant)
- **Aggiornamenti minor e patch** (security, bug fix) — purché si mantenga il Cloud Care attivo
- **Major version upgrade**: 70% di sconto sul prezzo licenza nuova versione per cliente con Cloud Care attivo, oppure pagamento differenza tier se upgrade di tier (es. Pro → Business)
- Tutti i moduli inclusi nel tier (es. comprando Lifetime Pro hai i moduli inclusi nel tier Pro SaaS)

### Cosa NON è incluso

- **Hosting** → Cloud Care
- **Supporto** → Cloud Care
- **Moduli aggiuntivi** sopra il tier → una tantum a parte (vedi §17)
- **Major version gratis** (sconto sì, gratis no)
- **Codice sorgente** (mai venduto, salvo accordo Enterprise con escrow — vedi §18)
- **Trasferimento licenza a terzi** (la licenza è nominativa al tenant, non rivendibile)

---

## 16. Cloud Care — il canone mensile obbligatorio

Il **Cloud Care è obbligatorio** con il modello Lifetime. Si compone di tre voci che possono essere acquistate separatamente o, più comunemente, in un bundle preconfezionato.

### Componenti separati

#### A. Hosting Managed (per utente / mese)

| Tier licenza | Hosting |
|---|---:|
| Starter | €6 |
| Professional | €10 |
| Business | €15 |
| Enterprise | €25+ (deploy dedicato, su misura) |

Include: infrastruttura cloud (Vercel/Railway + DB managed), backup giornalieri con retention 30 giorni, monitoraggio uptime, CDN, certificati SSL, dominio dedicato `<cliente>.coordinate.app`.

#### B. Supporto (per utente / mese)

| Livello | Prezzo | SLA risposta |
|---|---:|---|
| Standard | €4 | Email — < 48h lavorative |
| Priority | €8 | Email + chat — < 4h lavorative |
| Premium | €15 | Email + chat + telefono — < 1h lavorativa, 24/5 |
| Dedicated | €25+ | Account manager dedicato — 24/7 negoziabile |

#### C. Aggiornamenti software (per utente / mese)

| Livello | Prezzo |
|---|---:|
| Updates (minor + security patch) | €4 |
| Updates + major versions incluse | €8 |

### Bundle Cloud Care preconfezionati (raccomandati)

Per semplificare la vendita:

| Bundle | Prezzo / utente / mese | Hosting | Supporto | Aggiornamenti |
|---|---:|---|---|---|
| **Care Starter** | **€12** | Starter | Standard | Updates |
| **Care Pro** | **€18** | Pro | Priority | Updates |
| **Care Business** | **€28** | Business | Premium | Updates + Major incluse |
| **Care Enterprise** | da **€50** | Dedicato | Dedicated | Updates + Major incluse |

Pagamento annuale: **–10% sui canoni Cloud Care**.

### Se il cliente non rinnova il Cloud Care

- **Hosting**: si interrompe entro 30 giorni di grace period — dati esportabili entro 60gg (poi cancellati per GDPR)
- **Aggiornamenti**: si fermano. Il software continua a funzionare alla versione installata, ma senza patch di sicurezza → fortemente sconsigliato
- **Supporto**: non più accessibile
- **Per riprendere**: reinstatement fee del **30% del Cloud Care saltato** (max 6 mesi recuperabili)

> Il modello Lifetime **non è** "pago una volta e basta". Il Cloud Care è di fatto obbligatorio per stare al sicuro. Va comunicato in modo trasparente al cliente in fase di vendita — altrimenti si genera frustrazione al primo rinnovo.

---

## 17. Moduli aggiuntivi una tantum

Stessa logica della licenza tier, applicata ai moduli add-on. Il cliente "compra" il modulo e lo aggiunge al suo tenant; il modulo entra nel perimetro degli aggiornamenti del Cloud Care.

**Regola di pricing**: licenza una tantum modulo = **circa 30 mesi del prezzo SaaS mensile** corrispondente. Stesso break-even del tier base.

### Listino moduli (una tantum / utente + delta Cloud Care)

| Modulo | Licenza una tantum / utente | + delta Care / utente / mese |
|---|---:|---:|
| `warehouse-multi` | €240 | +€2 |
| `barcode` | €120 | +€1 |
| `suppliers` | €180 | +€1,5 |
| `production` | €450 | +€4 |
| `logistics` | €240 | +€2 |
| `it-fatturazione-sdi` | €360 | +€3 (+ consumo SDI) |
| `it-conservazione` | €90 | +€1 (+ consumo) |
| `marketing-automation` | €540 | +€5 |
| `forms-landing` | €150 | +€1 |
| `lead-scoring` | €150 | +€1 |
| `live-chat` | €240 | +€2 |
| `sla-management` | €150 | +€1,5 |
| `projects` | €300 | +€3 |
| `time-tracking` | €120 | +€1 |
| `gantt` | €150 | +€1 |
| `resource-planning` | €240 | +€2 |
| `hr-employees` | €240 | +€2 |
| `hr-attendance` | €300 | +€3 |
| `hr-leave` | €120 | +€1 |
| `hr-expenses` | €150 | +€1 |
| `cashflow` | €180 | +€1,5 |
| `bank-reconciliation` | €360 | +€3 (+ consumo PSD2) |
| `dms` | €180 | +€1,5 |
| `e-signature` | €150 | +€2 (+ consumo) |
| `email-integration` | €180 | +€2 |
| `voip-integration` | €450 | +€4 |
| `whatsapp-business` | €600 | +€5 (+ costi Meta) |
| `reports-builder` (avanzato) | €240 | +€2 |
| `embedded-bi` | €750 | +€6 |
| `ai-assistant` | €540 | +€5 (+ consumo API) |
| `ai-content-gen` | €240 | +€2 (+ consumo) |

### Verticali — licenze una tantum

| Verticale | Licenza una tantum / utente | + delta Care / utente / mese |
|---|---:|---:|
| `vertical-studi-professionali` | €450 | +€4 |
| `vertical-edilizia` | €750 | +€7 |
| `vertical-real-estate` | €540 | +€5 |
| `vertical-sanita` | €660 | +€6 |
| `vertical-fitness` | €360 | +€3 |
| `vertical-wedding-events` | €360 | +€3 |
| `vertical-automotive` | €540 | +€5 |
| `vertical-ristorazione` | €450 | +€4 |
| `vertical-hotel-bb` | €600 | +€5 |

### Integrazioni — flat una tantum (indipendenti dal n. utenti)

| Integrazione | Una tantum | + Care / mese |
|---|---:|---:|
| `integration-teamsystem` | €3.500 | +€80 |
| `integration-zucchetti` | €4.200 | +€100 |
| `integration-fattureincloud` | €900 | +€20 |
| `integration-shopify` | €1.200 | +€25 / store |
| `integration-woocommerce` | €900 | +€20 / store |
| `integration-magento` | €2.400 | +€55 / store |
| `integration-prestashop` | €1.500 | +€30 / store |
| `integration-banks-psd2` | €1.500 | +€20 (+ consumo) |
| Altre integrazioni custom | a preventivo | a preventivo |

---

# Parte III — Modello "On-Premise"

## 18. On-premise — installazione presso il cliente

Per clienti Enterprise che richiedono **installazione sui propri server** (cloud privato, datacenter aziendale, infrastruttura on-prem). Non è un'opzione retail: si vende a fronte di esigenze specifiche di compliance, sovranità del dato, o policy interne.

### Listino on-premise

| Voce | Prezzo |
|---|---|
| **Licenza on-premise per utente** | **2× del prezzo Lifetime managed** (es. Business on-premise = €2.980/utente vs €1.490 managed) |
| **Installation services** (una tantum) | **€5.000 – €20.000** (a preventivo, dipende da infra cliente, ambienti, CI/CD richiesto) |
| **Care On-Premise** (mensile, per utente) | **€12 – €25/utente/mese** — solo supporto + aggiornamenti + troubleshooting remoto (no hosting) |
| **Audit di sicurezza preliminare** (consigliato) | **€3.500 – €8.000** |

Il **2×** della licenza compensa la perdita del margine ricorrente da hosting che noi non incassiamo, e copre maggior complessità di rilascio.

### Cosa il cliente deve fornire (requisiti minimi)

- PostgreSQL 15+ (managed o self-managed)
- Node.js runtime (LTS) su container o VM Linux
- Object storage S3-compatible (Minio, AWS S3, Azure Blob, GCS)
- Dominio + certificato SSL
- Accesso VPN/SSH per il nostro team in fase di installazione e supporto
- Documentazione architetturale dell'ambiente
- Procedure di backup interne (noi raccomandiamo ma non gestiamo)

### Senza canone Care On-Premise

- Niente aggiornamenti software (security patches comprese) → **fortemente sconsigliato**
- Cliente può "congelare" l'installazione alla versione corrente a proprio rischio
- Avvertimento da inserire in contratto: nessuna responsabilità sul software non aggiornato

### Codice sorgente (di norma NON consegnato)

Il codice resta proprietà di Coordinate. Per Enterprise con esigenze di compliance speciali sono negoziabili **tre livelli**:

| Opzione | Cosa significa | Costo indicativo |
|---|---|---|
| **Source escrow** | Codice depositato presso terzo (NCC Group, Iron Mountain). Liberato al cliente solo in caso di cessazione attività di Coordinate. | **€2.000 – €4.000 / anno** |
| **Read-only access** | Cliente vede il codice (audit di sicurezza/compliance) ma non può modificarlo né ridistribuirlo. | **€8.000 una tantum + audit semestrale incluso** |
| **Source license** | Vendita del codice. Irreversibile, perde supporto e aggiornamenti. | **≥ 5× licenza standard**, raramente offerta, sign-off founder obbligatorio |

---

# Parte IV — Confronto e scelta tra modelli

## 19. Esempi di preventivo — modello Lifetime License

Stessi 4 scenari della §10 SaaS, ricalcolati con il modello Lifetime per confronto diretto.

### Esempio 1 — Studio consulenza 5 persone (Lifetime Pro)

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Licenza Professional una tantum | 5 utenti | €890 | **€4.450** |
| Licenza `projects` | 5 | €300 | €1.500 |
| Licenza `time-tracking` | 5 | €120 | €600 |
| **Licenze una tantum** | | | **€6.550** |
| Care Pro + delta `projects` (+€3) + `time-tracking` (+€1) | 5 utenti | €22/m | €110/mese |
| **Ricorrente annuo** | | | **€1.320** |
| Onboarding Standard | una tantum | €750 | €750 |
| **ANNO 1 TOTALE** | | | **€8.620** |
| **Anni 2-5 (× 4)** | | | €5.280 |
| **TOTALE 5 ANNI** | | | **≈ €13.900** |

Confronto SaaS Esempio 1 (5 anni): ≈ €14.550. **Risparmio per cliente: €650 in 5 anni**, in cambio di un anno 1 più alto (€8.620 vs €3.510).

### Esempio 2 — PMI commerciale magazzino 20 persone (Lifetime Business)

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Licenza Business una tantum | 20 utenti | €1.490 | **€29.800** |
| Licenza `warehouse-multi` | 20 | €240 | €4.800 |
| Licenza `barcode` | 20 | €120 | €2.400 |
| Licenza `suppliers` | 20 | €180 | €3.600 |
| **Licenze una tantum** | | | **€40.600** |
| Care Business + delta moduli (+€6,5/u) | 20 utenti | €34,5/m | €690/mese |
| **Ricorrente annuo** | | | **€8.280** |
| Onboarding Premium | una tantum | €2.500 | €2.500 |
| Migrazione dati | una tantum | €1.200 | €1.200 |
| **ANNO 1 TOTALE** | | | **≈ €52.580** |
| **Anni 2-5 (× 4)** | | | €33.120 |
| **TOTALE 5 ANNI** | | | **≈ €85.700** |

Confronto SaaS Esempio 2 (5 anni): ≈ €90.100. **Risparmio per cliente: €4.400** in 5 anni, esborso anno 1 di €52.580 (vs €20.980 SaaS).

### Esempio 3 — Azienda servizi 60 persone (Lifetime Business + integrazione)

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Licenza Business una tantum | 60 utenti | €1.490 | €89.400 |
| Sconto volume 50+ (–15%) | | | **–€13.410** |
| Licenze add-on (mkt-auto + live-chat + SLA + VoIP) | 60 × (€540+€240+€150+€450) | | €81.000 |
| Sconto volume add-on (–15%) | | | –€12.150 |
| Integrazione TeamSystem | flat | €3.500 | €3.500 |
| **Licenze una tantum** | | | **€148.340** |
| Care Business + delta moduli (+€10,5/u) + TS | 60 × €38,5 + €80 | | €2.390/mese |
| **Ricorrente annuo** | | | **€28.680** |
| Setup TeamSystem | una tantum | €1.500 | €1.500 |
| Onboarding Premium | una tantum | €2.500 | €2.500 |
| Migrazione da HubSpot | una tantum | €5.500 | €5.500 |
| Training | una tantum | €3.750 | €3.750 |
| **ANNO 1 TOTALE** | | | **≈ €190.270** |
| **Anni 2-5 (× 4)** | | | €114.720 |
| **TOTALE 5 ANNI** | | | **≈ €304.990** |

Confronto SaaS Esempio 3 (5 anni): ≈ €355.000. **Risparmio cliente: ≈ €50k** in 5 anni. Anno 1 più alto di +€108k.

### Esempio 4 — Enterprise 120 utenti, on-premise + modulo custom

| Voce | Q.tà | Prezzo unit. | Totale |
|---|:-:|---:|---:|
| Licenza Enterprise on-premise | 120 utenti | €3.500 (negoziato) | €420.000 |
| Sconto volume 100+ (–20%) | | | **–€84.000** |
| Installation services | una tantum | €15.000 | €15.000 |
| Modulo custom "Gestione Flotta" | una tantum | €38.000 | €38.000 |
| **Licenze + installazione una tantum** | | | **€389.000** |
| Care On-Premise + manutenzione modulo custom | 120 × €20/m + €350 | | €2.750/mese |
| **Ricorrente annuo** | | | **€33.000** |
| Migrazione complessa | una tantum | €18.000 | €18.000 |
| Audit sicurezza | una tantum | €3.500 | €3.500 |
| **ANNO 1 TOTALE** | | | **≈ €443.500** |
| **Anni 2-5 (× 4)** | | | €132.000 |
| **TOTALE 5 ANNI** | | | **≈ €575.500** |

Confronto SaaS Esempio 4 (5 anni): ≈ €220.300 anno 1 + €160.800 × 4 = ≈ €864.000. **L'on-premise costa meno totale** ma anno 1 è il più caro in assoluto, e il cliente prende su di sé hosting/operations.

---

## 20. Come presentare al cliente la scelta tra i modelli

### Pitch sales (versione breve)

> "Coordinate si compra in tre modi:
> - **In abbonamento mensile** (SaaS): paghi solo finché lo usi, niente upfront, massima flessibilità. È il modello con cui partono quasi tutti.
> - **Una tantum + canone supporto** (Lifetime): paghi la licenza come faresti per un gestionale tradizionale, poi un canone più basso per hosting e aggiornamenti. Conviene se prevedi di usarlo per molti anni e hai budget CAPEX disponibile.
> - **Installato presso di te** (On-premise): solo per organizzazioni grandi con esigenze di sovranità dati o compliance. Tu controlli l'infrastruttura, noi forniamo software, aggiornamenti e supporto."

### Tabella di confronto sintetica (PMI Pro/Business 20-60 utenti su 5 anni)

| Aspetto | Subscription SaaS | Lifetime + Cloud Care | On-Premise |
|---|---|---|---|
| Esborso Anno 1 | 💰 Basso | 💰💰💰 Alto | 💰💰💰💰 Molto alto |
| Esborso Anni 2-5 (cad.) | 💰💰 Costante | 💰 Ridotto | 💰 Ridotto |
| Costo totale 5 anni | 100% (riferimento) | 92–95% | 80–90% (escluso hosting cliente) |
| Hosting | ✅ Incluso | ✅ Incluso | ❌ A carico cliente |
| Aggiornamenti | ✅ Inclusi | ✅ Inclusi (col Care) | ✅ Inclusi (col Care) |
| Lock-in percepito | Basso | Medio | Basso (ha software in casa) |
| "Possedere" l'asset | No | Sì (licenza perpetua) | Sì (licenza + ambiente) |
| Flessibilità cambio tier | Alta | Media | Bassa |
| Cancel anytime | ✅ | ✅ (perde solo se cessa attività) | ✅ |
| Sicurezza / Compliance | Alta | Alta | Massima |
| Adatto a fondi/bandi | Limitato | ✅ Sì (asset acquistabile) | ✅ Sì |

### Decisione rapida (cheat sheet per il sales)

```
Cliente con budget anno 1 limitato                → SaaS
Startup early stage                                → SaaS
Cliente Starter                                    → SaaS (sempre)
PMI solida, ha budget CAPEX, vuole 5+ anni         → proponi Lifetime
Cliente "vecchia scuola" italiano (ex-TeamSystem)  → Lifetime (è il modello che conosce)
PA, sanità, finanza, difesa                        → On-premise
Cliente con bando/finanziamento per "software"     → Lifetime (asset ammortizzabile)
Cliente che chiede modulo custom Tier 4            → Business SaaS o Lifetime, mai Starter
```

### Regole d'oro

- **Non proporre Lifetime di default**. Proponi sempre SaaS prima — passa al Lifetime solo se il cliente solleva l'argomento o se è chiaramente nel profilo.
- **Lifetime sotto i €5.000 di licenza una tantum** non vale la complessità contrattuale. Spingi verso SaaS.
- **On-premise sotto i 50 utenti** raramente ha senso economico. Verifica che il cliente capisca i costi infra che si accolla.
- **Conversioni tra modelli**: documenta nel contratto le regole (es. da SaaS a Lifetime si può a fine anno, riconoscendo il 50% del subscription già pagato come credito sulla licenza).

---

## 21. Cosa NON fare nel pricing

- **Non offrire "sconti finali del 50%"** alla disperata. Distrugge la percezione di valore e si propaga ai prossimi prospect.
- **Non fare prezzo "su quotazione" già da Starter/Pro**. La trasparenza vince contro Salesforce, che è famoso per pricing opachi.
- **Non vendere moduli singoli senza tier base**. Il tier è la fondazione; gli add-on sono moltiplicatori. Mai sostituti.
- **Non promettere date di rilascio per moduli non ancora costruiti**. Se un prospect ne chiede uno, valutare se diventare un caso Tier 4 finanziato dal cliente.
- **Non firmare contratti pluriennali senza clausola di adeguamento**. Inflazione e costi cloud aumentano.

---

## Cambi rispetto a benchmark (giustificazione)

Per riferimento (al 2025-2026):

- **HubSpot CRM**: Starter $20/seat, Pro $90/seat — noi Pro è circa 35% sotto Pro HubSpot
- **Pipedrive**: €15-99/seat — noi Starter sovrapposto, ma offriamo molto più del puro CRM
- **Salesforce Sales Cloud**: €25-330/seat — noi sotto di un fattore 2-3x con esperienza italiana migliore
- **Zoho CRM**: €14-52/seat — competitor diretto su Starter, noi più moderno e italianizzato
- **TeamSystem CRM in Cloud**: ~€25-50/seat — competitor verticale italiano, noi più flessibile/moderno

**Posizionamento**: "Più moderno e flessibile di TeamSystem/Zoho, più italianizzato e accessibile di HubSpot/Salesforce, modulare come Odoo ma con UX di livello SaaS moderno".
