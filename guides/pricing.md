# Coordinate — Pricing & Listino

> **Disclaimer**: i prezzi in questo documento sono **orientativi**. Vanno validati e negoziati caso per caso col singolo cliente. Tutti i prezzi sono **netti IVA esclusa (22%)**, in Euro.

---

## 1. Filosofia di pricing

Coordinate è una **boutique platform** venduta a un numero ristretto di clienti (~5 totali). Non è un SaaS aperto. Niente listino pubblico, niente tier rigidi, niente self-serve.

Tre principi:

1. **Canone annuale + setup fee per moduli custom**. Un solo modello commerciale. Il cliente paga un canone fisso annuale per usare la piattaforma + un costo una tantum quando vuole un modulo costruito su misura.
2. **Trasparenza totale col cliente**. Il cliente vede esattamente cosa paga: canone, moduli inclusi, eventuali moduli custom con i loro setup fee, servizi una tantum (migrazione, training).
3. **Vendita diretta white-glove**. Niente Stripe, niente carta, niente trial automatici. Si firma un contratto, si fattura, si bonifica.

---

## 2. Componenti del prezzo

### A. Canone annuale piattaforma (la base)

Cosa include **sempre**:
- Foundation completa (auth, RBAC, multi-tenant, tenant-admin, file storage, audit log, ricerca, theming)
- **I 5 moduli core MVP**: `crm-contacts`, `crm-pipeline`, `activities`, `warehouse`, `dashboard`
- Hosting (Vercel + Neon + R2 EU)
- Backup giornalieri + retention 30gg
- Manutenzione correttiva (bug fix, security patches, dependency upgrades)
- Aggiornamenti minor della piattaforma e dei moduli inclusi
- Supporto email (risposta < 24h lavorative)

Range indicativo (da negoziare):
- **Canone annuale base**: €6.000 – €15.000 / anno (cliente con 3-15 utenti)
- **Canone annuale "fascia alta"**: €15.000 – €30.000 / anno (cliente con 15-50 utenti o con moduli extra dal catalogo)

Il prezzo cresce con:
- numero di utenti del tenant
- numero di moduli del catalogo abilitati (oltre i core MVP)
- requisiti SLA (uptime, tempo risposta supporto)
- consumi infrastrutturali (storage, traffico, query DB)

### B. Setup fee per modulo custom (una tantum)

Quando il cliente chiede un modulo costruito su misura per lui (es. "Gestione Flotta", "Cruscotto Filiali"), si quota separatamente:

| Tipo modulo | Setup fee indicativa | Esempio |
|---|---|---|
| Modulo piccolo (`[S]`) | €4.000 – €10.000 | Validazione P.IVA, alert custom, mini-tool |
| Modulo medio (`[M]`) | €10.000 – €30.000 | Gestione contratti di noleggio, dashboard verticale |
| Modulo grande (`[L]`) | €30.000 – €80.000 | Gestione cantieri SAL, calendario lavorazioni CNC |
| Modulo molto grande (`[XL]`) | €80.000 – €200.000+ | Sotto-ERP verticale, integrazione legacy complessa |

Il **canone annuale aumenta** dopo la consegna del modulo custom, per coprire manutenzione + hosting di quel modulo:
- Indicativamente **+€600 a +€3.000 / anno** per modulo custom in manutenzione, in base a complessità e dipendenze esterne

### C. Servizi una tantum (a richiesta)

Si quotano caso per caso:

| Servizio | Range indicativo |
|---|---|
| Onboarding standard (setup tenant + sessione kick-off + 1 training 2h) | Incluso nel primo anno |
| Onboarding esteso (config + 3-5 sessioni training + affiancamento 1-2 mesi) | €2.000 – €5.000 |
| Migrazione da Excel/CSV (mapping standard) | €500 – €1.500 |
| Migrazione da altro CRM o gestionale | €2.500 – €15.000 (a preventivo) |
| Sessione training aggiuntiva (2h remoto) | €300 – €500 |
| Giornata training on-site | €1.200 – €1.800 + trasferte |
| Consulenza personalizzazione (analisi processo) | €700 – €950 / giorno |
| Audit di sicurezza esterno (se richiesto dal cliente) | A preventivo (provider terzo) |

---

## 3. Tariffe interne per stima moduli custom

Per fare i preventivi rapidamente:

| Profilo | Tariffa giornaliera |
|---|---|
| Senior developer / Solution architect | €750 – €950 |
| Product / UX design | €600 – €750 |
| Project management | €600 – €700 |

Tipica scomposizione di un modulo `[M]` medio (40-80 giorni-uomo): 70% sviluppo + 20% design + 10% PM/QA.

---

## 4. Esempi di preventivo

### Esempio 1 — Primo cliente Acme, 8 utenti, no moduli custom

**Profilo**: PMI commerciale, 8 utenti, vuole CRM + magazzino base. Niente personalizzazioni il primo anno.

| Voce | Quantità | Prezzo |
|---|:-:|---:|
| Canone annuale piattaforma (5 moduli core, 8 utenti) | 1 anno | **€8.000** |
| Onboarding standard | incluso | €0 |
| Migrazione contatti da Excel | una tantum | €800 |
| **Anno 1 totale** | | **€8.800 + IVA** |
| Anno 2+ ricorrente | | €8.000 / anno |

### Esempio 2 — Cliente Beta, 15 utenti, 1 modulo custom

**Profilo**: azienda logistica, 15 utenti, vuole CRM core + modulo bespoke "Gestione Flotta" (veicoli, scadenze, autisti).

| Voce | Quantità | Prezzo |
|---|:-:|---:|
| Canone annuale piattaforma (5 moduli core, 15 utenti) | 1 anno | **€12.000** |
| Setup fee modulo `beta-fleet` (dimensione M) | una tantum | €22.000 |
| Manutenzione modulo custom (incluso nel canone anno 2+) | annuale | +€1.500 / anno |
| Onboarding esteso | una tantum | €3.500 |
| Migrazione anagrafiche da gestionale esistente | una tantum | €4.000 |
| **Anno 1 totale** | | **€41.500 + IVA** |
| Anno 2+ ricorrente | | €13.500 / anno |

### Esempio 3 — Cliente Gamma, 25 utenti, 2 moduli dal catalogo + 1 custom

**Profilo**: studio professionale, 25 utenti, vuole core + `calendar` + `quotes` (dal catalogo) + modulo "Pratiche Cliente" custom per il loro workflow specifico.

| Voce | Quantità | Prezzo |
|---|:-:|---:|
| Canone annuale piattaforma (5 core + 2 catalogo, 25 utenti) | 1 anno | **€18.000** |
| Costruzione `calendar` (modulo a catalogo non ancora costruito) | una tantum | €12.000 |
| Costruzione `quotes` (idem) | una tantum | €18.000 |
| Setup fee modulo `gamma-pratiche` (dimensione M+) | una tantum | €35.000 |
| Manutenzione modulo custom anno 2+ | annuale | +€2.500 / anno |
| Onboarding esteso + training power users | una tantum | €5.000 |
| **Anno 1 totale** | | **€88.000 + IVA** |
| Anno 2+ ricorrente | | €20.500 / anno |

> **Nota**: i moduli `calendar` e `quotes` sono nel catalogo (`modules-catalog.md`) ma non sono ancora stati costruiti nell'MVP. Il primo cliente che li richiede paga per la loro costruzione una tantum, e da quel momento entrano nel catalogo "già pronti" e vengono inclusi nel canone di altri clienti che li abilitano (a un costo aggiuntivo nel canone, ma senza setup fee).

---

## 5. Cosa è incluso vs cosa è extra

### Sempre incluso nel canone

- ✅ Foundation (auth, multi-tenant, RBAC, RLS, audit log, file storage, ricerca, branding)
- ✅ I 5 moduli core MVP
- ✅ Hosting (Vercel + Neon + R2 in EU)
- ✅ Backup giornaliero + retention 30gg
- ✅ Bug fix / security patches / dependency upgrades
- ✅ Aggiornamenti minor della piattaforma
- ✅ Supporto email (< 24h lavorative)
- ✅ Onboarding standard (kick-off + 1 training)

### Extra a pagamento

- 💰 Moduli aggiuntivi dal catalogo (oltre i 5 core)
- 💰 Moduli custom (setup fee + impatto canone)
- 💰 Migrazione dati (sopra il minimo CSV semplice)
- 💰 Training oltre la sessione iniziale
- 💰 Supporto SLA premium (response time < 4h, telefonico, ecc.)
- 💰 Deploy dedicato (DB separato, infrastruttura isolata)
- 💰 Storage extra oltre soglia inclusa
- 💰 Integrazioni custom con sistemi proprietari del cliente

### Mai incluso, mai venduto

- ❌ Codice sorgente
- ❌ White-label (rebrand completo del prodotto come fosse del cliente)
- ❌ Trasferimento licenza a terzi

---

## 6. Contrattualistica

### Durata e rinnovo
- **Contratto annuale** con tacito rinnovo (cliente recede con preavviso scritto 60gg prima della scadenza)
- Adeguamento prezzo al rinnovo: opzionale, comunicato con 60gg di anticipo, mai sul contratto in corso

### Pagamento
- **Canone annuale**: fattura unica a inizio anno contrattuale, bonifico bancario (IBAN su fattura), 30gg data fattura
- **Setup fee modulo custom**: 30% upfront alla firma SOW, 40% a metà milestone, 30% al collaudo
- **Servizi una tantum**: fattura a consegna, 30gg data fattura

### Proprietà intellettuale moduli custom
- IP del codice custom: **mantenuto da Coordinate**
- Cliente ha licenza d'uso illimitata sul suo tenant
- Se un modulo custom viene "promosso" a modulo standard del catalogo, il cliente co-finanziatore ottiene uno **sconto del 25% lifetime** sul canone di quel modulo (per tutti gli anni futuri)

### Garanzie e SLA base
- **Uptime target**: 99% (best-effort, niente penali contrattuali sul primo cliente; eventualmente sì sul secondo se richiesto)
- **Bug critici** (sistema inutilizzabile): intervento entro 4h lavorative
- **Bug bloccanti** (feature critica rotta): intervento entro 8h lavorative
- **Bug minori**: roadmap mensile

### Export dati e uscita
- **Export completo dati tenant** a richiesta: garantito per 60gg dopo eventuale cessazione contratto, poi cancellati per GDPR
- Niente fee di uscita

---

## 7. Come parlare di prezzo col cliente

### Discovery (prima call)
1. Capisci il caso d'uso (quali processi, quanti utenti, quali integrazioni)
2. Identifica quali moduli del catalogo userebbe e quali servirebbero ad-hoc
3. **Non dare un prezzo a freddo**. Spiega che fai un preventivo strutturato dopo aver capito i requisiti

### Preventivo (entro 1 settimana)
1. Documento con: canone annuale + breakdown moduli + setup fee custom + servizi una tantum + totale anno 1 + ricorrente anno 2+
2. Tabella tipo §4 con voci chiare
3. SOW separato per i moduli custom (ambito, milestone, criteri di accettazione)

### Negoziazione
- Sconti accettabili: 10-15% sul canone annuale a fronte di prepagamento a 2 anni
- Sconti che NON facciamo: drastici (>20%) "perché è il primo cliente". Distrugge la percezione di valore e si propaga ai successivi.
- Se il cliente è fuori budget: ridurre lo scope, non il prezzo. Es. togliere il modulo custom dal primo anno, partire solo coi core.

---

## 8. Note operative

### Cose che NON faremo

- ❌ **Listino pubblico sul sito** — il prezzo è negoziato
- ❌ **Trial gratuiti** — il cliente si impegna con contratto, eventualmente con periodo di "comfort" rimborsabile nei primi 30gg
- ❌ **Sconti aggressivi finali** — distruggono il posizionamento
- ❌ **Pricing per utente puro** — il prezzo è "pacchetto annuale", non lineare; chi ha 5 utenti non paga 5×, chi ne ha 50 non paga 50×

### Cose che faremo

- ✅ **Quote personalizzate** per ogni cliente
- ✅ **Contratto + SOW** per ogni intervento di sviluppo
- ✅ **Trasparenza sul costo** del modulo custom (giorni-uomo, fasi, milestone)
- ✅ **Comunicazione proattiva** sul roadmap del cliente: cosa sviluppiamo nei prossimi 6 mesi, cosa è in arrivo

---

## 9. Quando rivedere questo documento

- Se il modello commerciale cambia (es. arriva un cliente che vuole SaaS puro → si valuta se introdurre Stripe + pricing pubblico)
- Se il numero di clienti supera 8-10 → forse non siamo più "boutique" e va ripensato tutto
- Annualmente, a inizio anno fiscale, per aggiornare i range di prezzo in base all'inflazione e ai costi infrastrutturali
