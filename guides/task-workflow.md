# Coordinate — Task & Branch Workflow (GitFlow semplificato)

Regole operative per come Claude Code e tu gestite il git in fase di sviluppo. Usiamo **GitFlow semplificato**: `main` è sempre stabile (la produzione), `develop` è l'integrazione, e ogni task vive su un branch dedicato che parte da `develop`. **Claude non mergi mai**: prepara il branch, ti consegna, e ti aspetti tu faccia la review.

---

## 1. Modello dei branch

```
main          ←  versione stabile / produzione
  ↑
  └─ develop  ←  integrazione delle feature completate (review già fatta)
       ↑
       ├─ feature/T0.4-pnpm-turbo          (task feature, parte da develop)
       ├─ feature/T1.5-tenant-middleware
       ├─ fix/T2.7-customer-import-encoding (bug fix scoperto durante un task)
       ├─ chore/upgrade-prisma-7.5         (manutenzione, non legata a task)
       └─ docs/clarify-pricing-faq         (docs in guides/ non triviali)

  hotfix/<slug>  ←  parte da main, urgenze produzione (raro pre-MVP)
```

**Regole d'oro**:

- `main` accetta merge **solo da `develop`** (e da `hotfix/*` se in emergenza). **Solo tu** fai questo merge, manualmente, a fine fase.
- `develop` accetta merge **solo da `feature/*` / `fix/*` / `chore/*` / `docs/*`**. **Solo tu** fai questo merge, dopo review del branch.
- Claude **non lavora mai direttamente su `main` o `develop`**. Lavora sempre su un branch dedicato e si ferma a "branch pronto per review".

---

## 2. Setup iniziale del repo (una tantum)

Se `develop` non esiste ancora, crearlo:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b develop
git push -u origin develop
```

Configurare git con default conservativi:

```bash
git config --local pull.ff only
git config --local merge.ff false
```

---

## 3. Naming convention dei branch

**Pattern**:

```
<tipo>/<identifier>-<kebab-slug>
```

Dove `<tipo>` è uno di:

| Tipo | Quando usare |
|---|---|
| `feature` | Task di tipo feature dal piano (nuovo modulo, nuova funzionalità). Default per quasi tutti i task. |
| `fix` | Bug fix di codice esistente. Anche un task del piano può essere `fix` se è risolutivo (raro nel MVP). |
| `chore` | Manutenzione non legata a un task del piano (upgrade dipendenze, refactor di config, pulizia). |
| `docs` | Modifiche significative ai file in `guides/` o `README.md`. (Per micro-fix in `guides/` si può lavorare direttamente su `develop` — vedi §14.) |
| `hotfix` | Fix urgenti in produzione che bypassano `develop`. Branch parte da `main`. |

`<identifier>` è:
- L'**ID del task** se esiste (es. `T1.5`)
- Lo slug solo, se è un'iniziativa fuori-piano (es. `chore/upgrade-prisma-7.5`)

**Esempi corretti**:
- `feature/T0.4-pnpm-turbo`
- `feature/T1.5-tenant-middleware`
- `feature/T3.16-quotes-module-base`
- `fix/T2.7-customer-import-encoding`
- `chore/upgrade-prisma-7.5`
- `docs/clarify-pricing-faq`
- `hotfix/login-redirect-loop`

**Regole**:
- Slug in kebab-case, max 4 parole
- Niente caratteri speciali oltre `-` e `/`
- Niente date, username, ticket esterni

---

## 4. Il rituale di una task (passo per passo)

Da seguire **sempre, in quest'ordine**, per ogni singolo task.

### Step 1 — Aggiornare `develop`
```bash
git checkout develop
git pull --ff-only origin develop
```
Se `pull` non è fast-forward → fermarsi, capire perché.

### Step 2 — Leggere la spec del task
Aprire `guides/implementation-tasks.md`, leggere **per intero** il task. Leggere anche i documenti di riferimento citati (`architecture.md`, `mvp-scope.md`, `modules-catalog.md`, `pricing.md`).

### Step 3 — Verificare le dipendenze
Controllare che i task in `Deps:` siano **tutti ✅ nel state globale**. Se manca un dep, non iniziare.

### Step 4 — Creare il branch da `develop`
```bash
git checkout -b feature/T<x.y>-<slug>
# (oppure fix/, chore/, docs/ secondo §3)
```

### Step 5 — Eseguire il task
Solo quanto è dichiarato nello scope. Eventuali bug correlati si annotano in `guides/known-issues.md` (vedi §9).

### Step 6 — Verificare gli acceptance criteria
Leggere ogni voce di **Done when:** del task e **dimostrare** esplicitamente che è soddisfatta. Non basta "compila".

### Step 7 — Lint, typecheck, test
```bash
pnpm lint
pnpm typecheck
pnpm test    # se applicabile
```
Tutti devono passare.

### Step 8 — Commit
Commit secondo le regole di §5. Più commit per task sono ammessi, devono essere logicamente coerenti.

### Step 9 — Aggiornare lo stato in `implementation-tasks.md`
Nella "Stato globale" in cima al file, incrementare il contatore della fase (es. `0/8` → `1/8`). Quando la fase è completa, sostituire `[ ]` con `[x]`.

Questo va in un **commit dedicato** sul task branch:
```
docs(tasks): mark T0.1 ✅

[T0.1]
```

### Step 10 — Push del branch
```bash
git push -u origin feature/T<x.y>-<slug>
```

### Step 11 — Consegna all'utente
Claude **si ferma qui**. Riporta all'utente:
- ID del task completato
- Nome del branch creato
- Numero di commit
- Lista degli acceptance criteria verificati (con ✅ ciascuno)
- Eventuali note (cose annotate in `known-issues.md`, decisioni minori prese)
- Comandi suggeriti per la review (es. `git log develop..feature/T0.1-...` + `git diff develop..feature/T0.1-...`)

**Claude NON esegue il merge**.

### Step 12 — (Tu) Review e merge su `develop`
Tu fai la review (diff, eventualmente checkout del branch e test manuale). Quando sei soddisfatto:

```bash
git checkout develop
git pull --ff-only origin develop
git merge --no-ff feature/T<x.y>-<slug> \
  -m "merge: T<x.y> <titolo task>"
git push origin develop
```

Il flag `--no-ff` preserva la storia del branch (ogni task resta un "blocco" visibile nel grafo).

### Step 13 — Cleanup del branch
```bash
git branch -d feature/T<x.y>-<slug>
git push origin --delete feature/T<x.y>-<slug>
```

### Step 14 — Fine fase: review tua + merge su `main`
Quando tutti i task di una fase sono ✅ e mergiati su `develop`:

1. Tu fai una **review complessiva** di `develop` (test E2E manuale, regression check sull'area toccata)
2. Quando sei soddisfatto:
```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "release: phase X complete"
git tag -a v0.X.0 -m "Phase X complete: <summary>"
git push origin main
git push origin v0.X.0
```

Vedi §8 per il tagging.

---

## 5. Convenzioni commit

Formato **Conventional Commits** con riferimento al task ID nel footer.

### Sintassi

```
<tipo>(<scope>): <subject>

<body opzionale>

[T<fase>.<num>]
```

### Tipi ammessi

| Tipo | Uso |
|---|---|
| `feat` | Nuova funzionalità visibile all'utente |
| `fix` | Bug fix |
| `refactor` | Modifica al codice senza cambio di comportamento esterno |
| `perf` | Miglioramento di performance |
| `test` | Aggiunta o modifica di test |
| `docs` | Modifiche a documentazione (incluse `guides/`) |
| `chore` | Manutenzione (deps, config, build) |
| `style` | Solo formattazione, niente logica |
| `build` | Modifiche al sistema di build (turbo.json, package.json scripts) |
| `ci` | Modifiche a GitHub Actions o pipeline |

### Scope (suggeriti)
- `monorepo`, `web`, `database`, `auth`, `api`, `ui`, `core`
- Nome modulo: `crm-contacts`, `warehouse`, `quotes`, `billing`, ...

### Subject
- **Imperativo presente** ("add", "fix", "remove" — NON "added", "fixed")
- **Minuscolo**, **senza punto finale**
- **Max 72 caratteri** della riga (`<tipo>(<scope>): <subject>` compreso)

### Esempi corretti

```
feat(monorepo): add pnpm workspace + turborepo config

[T0.4]
```

```
feat(auth): wire better-auth with email/password and google oauth

Integrates Better-Auth with organizations plugin to back the tenant model.
Email verification flow is mandatory before tenant creation.

[T1.4]
```

```
fix(crm-pipeline): prevent drop on archived stage

[T2.8]
```

```
docs(tasks): mark T0.1 ✅

[T0.1]
```

### Esempi sbagliati

```
❌ Updated stuff
❌ feat: Auth.
❌ T1.4 - aggiunto better auth e fixato qualche cosa
❌ wip
```

### Quanti commit per task?

- **1 commit** se il task è atomico (preferibile)
- **2-5 commit** se ci sono passaggi distinti (es. "add schema" + "add UI" + "add tests")
- **Mai squashare** prima della consegna — i commit raccontano qualcosa di utile durante la review
- **L'ultimo commit del task è SEMPRE quello che aggiorna `implementation-tasks.md`**

---

## 6. Strategia di merge (riepilogo)

| Sorgente | Destinazione | Chi lo fa | Quando | Comando |
|---|---|---|---|---|
| `feature/*` / `fix/*` / `chore/*` / `docs/*` | `develop` | **Tu** | Dopo review del task | `git merge --no-ff` |
| `develop` | `main` | **Tu** | A fine fase, dopo review complessiva | `git merge --no-ff` + tag |
| `hotfix/*` | `main` **e** `develop` | **Tu** | Solo emergenze produzione | `git merge --no-ff` su entrambi |

### Rebase prima della consegna?

Se durante il task `develop` è andato avanti (altri task mergiati), **rebasare** il task branch prima della consegna:

```bash
git fetch origin
git checkout feature/T<x.y>-<slug>
git rebase origin/develop
# risolvere eventuali conflitti
git push --force-with-lease   # solo se il branch era già stato pushato
```

`--force-with-lease` è più sicuro di `--force` (non sovrascrive se qualcun altro ha pushato nel frattempo).

---

## 7. Checklist pre-consegna (prima del push)

Prima che Claude consegni il branch all'utente (Step 11), **deve rispondere onestamente sì a tutte queste**:

- [ ] Tutti gli **Acceptance Criteria** del task sono soddisfatti?
- [ ] `pnpm lint` passa senza errori (warning gestiti)?
- [ ] `pnpm typecheck` passa?
- [ ] Test rilevanti passano (`pnpm test` se applicabile)?
- [ ] Smoke test manuale dell'area toccata fatto?
- [ ] Nessun file `.env`, segreto o chiave nel diff?
- [ ] Nessuna stringa di debug (`console.log`, `// TODO MY_NAME`) dimenticata?
- [ ] I commit message seguono le convenzioni (§5)?
- [ ] Lo stato in `implementation-tasks.md` è aggiornato?
- [ ] Il branch è rebasato sull'ultimo `origin/develop`?

Se anche una sola risposta è "no", **non consegnare**. Fixare, poi rivalutare.

---

## 8. Tagging e versioning

Versioning **semver** legato alle fasi MVP. I tag vanno **solo su `main`**, dopo il merge `develop → main`.

| Evento | Tag |
|---|---|
| Fase 0 completata | `v0.0.1` |
| Fase 1 completata | `v0.1.0` |
| Fase 2 completata | `v0.2.0` |
| Fase 3 completata | `v0.3.0` |
| Fase 4 completata | `v0.4.0` |
| Fase 5 completata | `v0.5.0` |
| Fase 6 completata | `v0.6.0` |
| Fase 7 completata | `v0.7.0` |
| **MVP go-live** | `v1.0.0` |

Esempio fine fase (lo fai tu, non Claude):

```bash
git checkout main
git pull --ff-only
git merge --no-ff develop -m "release: phase 1 complete"
git tag -a v0.1.0 -m "Phase 1 complete: backend, auth, multi-tenant"
git push origin main
git push origin v0.1.0
```

Post-MVP:
- Major (`v2.0.0`) = breaking changes (es. cambio modello dati)
- Minor (`v1.X.0`) = nuove feature retro-compatibili
- Patch (`v1.0.X`) = bug fix

---

## 9. Cosa NON fare durante un task

Regole sacre. Violarle è il modo numero 1 per accumulare scope creep e bug.

### Mai durante un task in corso

- ❌ **Espandere lo scope**: "tanto ci sono, miglioro anche X" → NO. X diventa un nuovo task.
- ❌ **Refattorizzare codice non toccato dal task**: anche se ti fa pena, lascialo.
- ❌ **Sistemare bug non correlati**: annotare in `guides/known-issues.md` (creare il file se non esiste).
- ❌ **Cambiare scelte architetturali**: se il task richiede di deviare da `architecture.md`, fermarsi e chiedere all'utente.
- ❌ **Saltare gli acceptance criteria**: il task non è ✅ finché non sono tutti soddisfatti.
- ❌ **Consegnare con check rossi**: lint, typecheck, test devono passare prima del push.
- ❌ **Committare segreti**: `.env`, chiavi, token. Mai.
- ❌ **Riformattare in massa**: non lanciare `prettier --write .` durante un task — diluisce il diff.
- ❌ **Mergiare su `develop` o `main`**: mai. Vedi §11.

### Cosa fare invece quando trovi cose da migliorare

Aggiungere una riga in `guides/known-issues.md` (creare se non esiste):

```markdown
- [ ] [Discovered during T2.7] crm-contacts: il filtro per tag è O(n²), va indicizzato
- [ ] [Discovered during T3.18] quotes: PDF render lento con > 50 righe
```

A fine fase, queste annotazioni si valutano: alcune diventano nuovi task, altre si chiudono come "wontfix".

---

## 10. Quando ti blocchi

Se durante un task succede una di queste cose, **fermati**:

1. Un acceptance criterion non si può soddisfare senza una scelta non documentata
2. Una dipendenza esterna non funziona (es. Stripe API change, libreria deprecata)
3. Il task richiede più tempo del previsto (Size dichiarata superata di 2×)
4. Una scelta architetturale del task contraddice quanto in `architecture.md`
5. Trovi un bug critico in codice esistente che impedisce di procedere

**Cosa fare**:

1. Committa lo stato attuale sul task branch (anche WIP, ok — prefisso commit con `wip:`)
2. Pusha il branch
3. **NON consegnare come "✅ pronto"**
4. Apri una conversazione con l'utente specificando:
   - Il task ID
   - Cosa hai fatto
   - Dove sei bloccato
   - Quali opzioni vedi
   - La tua raccomandazione

**Non improvvisare scelte architetturali**. Mai.

---

## 11. Regole specifiche per Claude Code

Quando una sessione Claude esegue un task, **deve**:

1. **Leggere il task completo** in `implementation-tasks.md` PRIMA di toccare codice
2. **Leggere `task-workflow.md`** (questo file) come prima azione
3. **Leggere i documenti di riferimento** elencati nel task
4. **Dichiarare il piano in 1-2 frasi** all'utente prima di iniziare a editare file
5. **Verificare di partire da `develop` aggiornato**
6. **Creare il branch** `feature|fix|chore|docs/T<x.y>-<slug>` prima di qualunque modifica
7. **Eseguire SOLO quanto specificato** nel task — niente "bonus"
8. **Verificare ogni acceptance criterion** in modo esplicito al termine
9. **NON committare automaticamente** — chiedere all'utente conferma del commit message
10. **Pushare il branch** dopo conferma dei commit
11. **Consegnare con report strutturato** (vedi §4 Step 11) e **fermarsi**

### Claude NON deve mai

- ❌ Lavorare su `main` direttamente
- ❌ Lavorare su `develop` direttamente
- ❌ Eseguire `git merge` — **mai, in nessun caso**, su nessun branch
- ❌ Eseguire `git push --force` (eccezione: `--force-with-lease` solo dopo rebase del task branch, e solo dopo aver chiesto all'utente)
- ❌ Eseguire `git tag` — il tagging è azione tua a fine fase
- ❌ Eliminare branch non suoi
- ❌ Saltare la creazione del task branch
- ❌ Modificare task già completati (`✅`) senza esplicito ok
- ❌ Modificare `guides/*` senza che sia parte del task corrente

### Comandi git che Claude può eseguire liberamente

`git status`, `git log`, `git diff`, `git branch` (lettura), `git checkout` (cambio branch), `git checkout -b` (crea nuovo branch), `git pull --ff-only origin develop`, `git add`, `git commit`, `git push -u origin <task-branch>`, `git rebase origin/develop` (sul proprio task branch), `git fetch`.

### Comandi git che Claude deve chiedere prima

`git push --force-with-lease`, qualunque cosa che riscriva la storia (rebase interattivo, amend, reset).

### Comandi git proibiti per Claude

`git merge` (in qualunque forma), `git push --force` (senza `--with-lease`), `git tag`, `git branch -D`, `git push origin --delete <branch protetto>` (su `main` o `develop`), `git reset --hard` su branch condivisi.

---

## 12. Esempio completo: T0.1 end-to-end

Walkthrough di come si svolge una sessione Claude per il task T0.1.

### Utente
> "Esegui il task T0.1 da `guides/implementation-tasks.md`"

### Claude (dichiarazione del piano)
> Eseguo T0.1: installazione pnpm + creazione branch dedicato. Prima di tutto leggo `task-workflow.md` e l'intera spec del task, poi verifico che `develop` esista e sia pulito, creo `feature/T0.1-install-pnpm` da lì, eseguo il task, aggiorno lo stato e ti consegno il branch per review (non mergo io).

### Claude (esecuzione)
```bash
# Lettura task-workflow.md + implementation-tasks.md sezione T0.1

# Setup
git checkout develop
git pull --ff-only origin develop
git status   # clean

# Verifica pnpm
pnpm --version
# se errore:
corepack enable
corepack prepare pnpm@latest --activate

# Branch
git checkout -b feature/T0.1-install-pnpm

# Aggiornamento implementation-tasks.md (incremento contatore fase 0)
# Edit guides/implementation-tasks.md
```

### Claude (verifica acceptance)
> Verifica:
> - ✅ `pnpm --version` ritorna 9.x
> - ✅ Branch corrente: `feature/T0.1-install-pnpm`
> - ✅ Working directory pulita
> - ✅ Stato Fase 0 aggiornato a `1/8` in `implementation-tasks.md`

### Claude (proposta di commit)
> Pronto al commit. Messaggio proposto:
>
> ```
> docs(tasks): mark T0.1 ✅ (pnpm installed, branch ready)
>
> [T0.1]
> ```
>
> Confermi?

### Utente
> Sì

### Claude (commit + push + consegna)
```bash
git add guides/implementation-tasks.md
git commit -m "docs(tasks): mark T0.1 ✅ (pnpm installed, branch ready)

[T0.1]"
git push -u origin feature/T0.1-install-pnpm
```

> **T0.1 consegnato.**
>
> - Branch: `feature/T0.1-install-pnpm` (pushato su origin)
> - Commit: 1
> - Acceptance criteria verificati:
>   - ✅ `pnpm --version` ≥ 9
>   - ✅ Branch corrente è `feature/T0.1-install-pnpm`
>   - ✅ Working dir pulita
>
> Per la review:
>
> ```bash
> git log develop..feature/T0.1-install-pnpm
> git diff develop..feature/T0.1-install-pnpm
> ```
>
> Quando sei soddisfatto, mergia su `develop`:
>
> ```bash
> git checkout develop
> git pull --ff-only
> git merge --no-ff feature/T0.1-install-pnpm \
>   -m "merge: T0.1 install pnpm + branch setup"
> git push origin develop
> git branch -d feature/T0.1-install-pnpm
> git push origin --delete feature/T0.1-install-pnpm
> ```

---

## 13. Hotfix workflow (emergenze in produzione)

Se dopo il go-live si presenta un bug critico:

```bash
# Branch da MAIN (non develop)
git checkout main
git pull --ff-only
git checkout -b hotfix/<slug>

# ... fix ...

git commit ...
git push -u origin hotfix/<slug>
```

Consegna all'utente. Quando approvato, **tu** mergi su entrambi `main` e `develop`:

```bash
git checkout main
git merge --no-ff hotfix/<slug> -m "hotfix: <description>"
git tag -a v1.0.1 -m "hotfix: <description>"
git push origin main v1.0.1

git checkout develop
git merge --no-ff hotfix/<slug> -m "merge hotfix: <description>"
git push origin develop

git branch -d hotfix/<slug>
git push origin --delete hotfix/<slug>
```

---

## 14. Eccezioni al workflow

Non tutte le modifiche richiedono un task branch. Casi in cui si può lavorare in modo più snello (sempre **non su `main`**):

| Caso | Come lavorare |
|---|---|
| Tipo / refuso nelle `guides/*` | Direttamente su `develop`, commit `docs: fix typo` |
| Refresh di `README.md` minore | Direttamente su `develop` |
| Aggiornamento di `CLAUDE.md` dopo decisione architetturale | Branch `docs/<slug>`, review, merge |
| Bump patch di una dipendenza (es. via Renovate) | Branch `chore/bump-<package>`, review, merge |
| Modifica significativa a un documento in `guides/` | Branch `docs/<slug>`, review, merge |

In questi casi, valgono comunque le regole §5 (convenzioni commit), ma non serve un task ID nel footer.

**Quando in dubbio**: usare un branch. È sempre più sicuro che lavorare diretto su `develop`.

---

## 15. Quick reference (cheat sheet)

### Inizio task (Claude)
```bash
git checkout develop && git pull --ff-only origin develop
git checkout -b feature/T1.5-tenant-middleware
```

### Lavoro + verifiche
```bash
pnpm lint && pnpm typecheck
```

### Commit + aggiorna tasks file
```bash
git add <files>
git commit   # template Conventional Commits

git add guides/implementation-tasks.md
git commit -m "docs(tasks): mark T1.5 ✅

[T1.5]"
```

### Push + consegna (Claude si ferma qui)
```bash
git push -u origin feature/T1.5-tenant-middleware
```

### Review + merge su develop (tu)
```bash
git checkout develop && git pull --ff-only
git diff develop..feature/T1.5-tenant-middleware
git log develop..feature/T1.5-tenant-middleware

git merge --no-ff feature/T1.5-tenant-middleware \
  -m "merge: T1.5 tenant middleware via subdomain"
git push origin develop
git branch -d feature/T1.5-tenant-middleware
git push origin --delete feature/T1.5-tenant-middleware
```

### Fine fase: develop → main + tag (tu)
```bash
git checkout main && git pull --ff-only
git merge --no-ff develop -m "release: phase 1 complete"
git tag -a v0.1.0 -m "Phase 1 complete: backend, auth, multi-tenant"
git push origin main v0.1.0
```
