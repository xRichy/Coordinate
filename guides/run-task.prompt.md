# Prompt — Eseguire i task del piano attivo

Due varianti. Incolla in una sessione **Claude Code aperta in questo repo**.

- **A) Loop con review gate** (consigliata): esegue tutti i task in sequenza, fermandosi dopo ognuno in attesa del tuo "ok".
- **B) Singolo task**: esegue un solo task che indichi tu.

---

## A) Eseguire tutti i task in sequenza (con review tra uno e l'altro)

Incollalo **una volta**. Determina lui il prossimo task; si ferma dopo ognuno e riparte solo al tuo "ok" (= hai revisionato e mergiato su `develop`).

```
Sei in una sessione Claude Code nel repo Coordinate. Lavora come ESECUTORE SEQUENZIALE
dei task del piano attivo `guides/single-domain-tasks.md`, con una mia revisione tra un
task e l'altro. NON ti dirò ogni volta quale task fare: lo individui tu.

PROTOCOLLO DEL LOOP
- Esegui i task ATTIVI (non `⏭ DEFERRED`) in ordine, dal primo non ancora `✅`,
  rispettando le `Deps`.
- Un task alla volta. Quando un task è completo e pushato, TI FERMI e aspetti la mia review.
- ⛔ REGOLA CENTRALE: non iniziare MAI il task successivo finché non rispondo
  esplicitamente con un'approvazione ("ok", "prosegui"). Qualsiasi altro messaggio
  (feedback, domanda, correzione) NON è un via libera: gestiscilo e torna ad aspettare.

PER OGNI TASK
1. Leggi lo spec del task in `guides/single-domain-tasks.md`, le regole git in
   `guides/task-workflow.md`, e `CLAUDE.md`. (`implementation-tasks.md` è solo ARCHIVIO.)
2. Verifica che tutte le `Deps` siano `✅`. Se no, fermati e dimmelo.
3. Parti da `develop` aggiornato e pulito; crea il branch dedicato (naming di
   `task-workflow.md`, es. `feat/t1-1/<slug>`). Mai lavorare su `develop`/`main`.
4. Esegui SOLO quel task. Bug correlati → `guides/known-issues.md`, non risolverli qui.
5. Verifica ESPLICITAMENTE ogni "Done when" (`pnpm typecheck` / `pnpm lint` / test /
   `pnpm dev` quando pertinente) e mostrami gli esiti.
6. Marca il task `✅` e aggiorna i conteggi dello stato globale in
   `guides/single-domain-tasks.md` come ULTIMO commit.
7. Pusha il branch. NON mergiare, NON aprire PR.
8. Consegna un report sintetico (cosa fatto, file toccati, verifica dei "Done when",
   eventuali voci aggiunte a known-issues, nome del branch) e poi FERMATI.

QUANDO RISPONDO "OK / PROSEGUI"
- Significa che ho revisionato E mergiato il branch precedente su `develop`.
- Allora: `git checkout develop`, verifica via `git log` (e `git pull` se c'è un remote)
  che le modifiche del task precedente siano su `develop` e che il task sia `✅`.
  Se NON risultano mergiate, FERMATI e avvisami (non ripartire).
- Poi individua e avvia il task attivo successivo, riapplicando questo protocollo.

SE DO FEEDBACK invece dell'ok: applica le correzioni sullo stesso branch del task
corrente, ripusha, e torna ad aspettare il mio ok.

FINE: quando non restano task attivi (o ti dico di fermarti a fine fase), dichiara
concluso il lavoro e riassumi cosa è stato completato.

Vincoli: codice/commenti/commit in INGLESE (Conventional Commits, footer `[T<x.y>]`);
i guides restano in italiano. Se ti blocchi su una scelta architetturale non improvvisare:
committa il WIP, pusha, fermati e segnalamelo (task-workflow.md §10).

Inizia ORA con il primo task attivo non completato (dovrebbe essere T1.1): dimmi qual è
e procedi.
```

**Perché funziona**: il tuo "ok" vale "ho revisionato e mergiato su `develop`". Serve perché i task dipendono l'uno dall'altro (es. T1.2 parte da T1.1, branchato da `develop`): se il precedente non è mergiato, l'esecutore si ferma invece di proseguire a vuoto.

---

## B) Eseguire un singolo task

Sostituisci `{{TASK_ID}}` (3 occorrenze) col task, es. `T1.1`.

```
Sei in una sessione Claude Code nel repo Coordinate. Esegui UN SOLO task, il {{TASK_ID}},
dal piano attivo `guides/single-domain-tasks.md`. Procedi così, senza saltare passi:

1. LEGGI PRIMA DI AGIRE: lo spec completo del task {{TASK_ID}} in
   `guides/single-domain-tasks.md`, le regole git in `guides/task-workflow.md`, e `CLAUDE.md`.
   Nota: `guides/implementation-tasks.md` è solo ARCHIVIO — non usarlo come fonte.

2. VERIFICA LE DIPENDENZE: tutte le `Deps` del task devono essere `✅` nello stato globale.
   Se una non lo è, FERMATI e segnalamelo invece di procedere.

3. BRANCH: assicurati che `git status` sia pulito e di essere su `develop` aggiornato;
   crea il branch dedicato col naming di `task-workflow.md` (es. `feat/t1-1/<slug>`).
   Non lavorare mai direttamente su `develop` o `main`.

4. ESEGUI SOLO {{TASK_ID}}: niente scope creep. I bug correlati che trovi vanno annotati
   in `guides/known-issues.md`, NON risolti qui.

5. VERIFICA OGNI "Done when" in modo esplicito (lancia `pnpm typecheck` / `pnpm lint` /
   test / `pnpm dev` quando pertinente) e mostrami l'esito di ciascun criterio.

6. AGGIORNA LO STATO del task in `guides/single-domain-tasks.md` (marca `✅` e aggiorna
   i conteggi nello stato globale) come ULTIMO commit del task.

7. PUSHA IL BRANCH E FERMATI: NON mergiare su `develop` né su `main`, NON aprire PR
   salvo richiesta esplicita.

8. CONSEGNA UN REPORT STRUTTURATO: cosa hai fatto, file toccati, come hai verificato
   ogni "Done when", eventuali deviazioni o voci aggiunte a known-issues, e il nome
   del branch pushato.

Vincoli: codice, commenti e commit message in INGLESE (Conventional Commits con footer
`[{{TASK_ID}}]`); la documentazione in `guides/` resta in italiano. Se ti blocchi su una
scelta architetturale NON improvvisare: committa il WIP, pusha, fermati e segnalamelo
(vedi `task-workflow.md` §10).
```

---

## Note

- I task marcati `⏭ DEFERRED` non vanno eseguiti: fuori scope MVP boutique (spec completo nell'archivio `implementation-tasks.md`).
- Entrambi i prompt si appoggiano a `CLAUDE.md` e ai guides già presenti nel repo: non duplicano le regole, le rinforzano sui punti critici (verifica `Done when`, stato come ultimo commit, **mai** merge, stop dopo il push).
