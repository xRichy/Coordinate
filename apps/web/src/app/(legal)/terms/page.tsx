import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termini di servizio — Coordinate" };

export default function TermsPage() {
  return (
    <>
      <h1>Termini di servizio</h1>
      <p className="!text-amber-600 dark:!text-amber-500">
        Bozza minimale — da far revisionare a un legale. Le condizioni vincolanti sono quelle del contratto firmato.
      </p>
      <p>Ultimo aggiornamento: giugno 2026.</p>

      <h2>1. Oggetto</h2>
      <p>
        Coordinate è una piattaforma gestionale modulare fornita in modalità white-glove. L&apos;accesso è riservato
        ai clienti con contratto attivo e ai loro utenti autorizzati.
      </p>

      <h2>2. Account e accesso</h2>
      <p>
        Ogni cliente (tenant) ha un account owner che gestisce gli utenti della propria azienda. Il numero di
        account è definito dal piano; account aggiuntivi sono soggetti a costo. Le credenziali sono personali e
        non cedibili.
      </p>

      <h2>3. Uso accettabile</h2>
      <ul>
        <li>Non è consentito tentare di accedere a dati di altri tenant o aggirare i controlli di sicurezza.</li>
        <li>Non è consentito caricare contenuti illeciti o dati per cui non si hanno i diritti.</li>
        <li>Non è consentito rivendere o concedere in licenza la piattaforma a terzi.</li>
      </ul>

      <h2>4. Disponibilità</h2>
      <p>
        Il servizio è erogato con impegno best-effort. Eventuali livelli di servizio (SLA) formali sono definiti
        nel contratto. Sono possibili interruzioni per manutenzione, comunicate ove possibile in anticipo.
      </p>

      <h2>5. Dati e proprietà</h2>
      <p>
        I dati inseriti restano di proprietà del cliente, che può esportarli in qualsiasi momento. Il codice e la
        proprietà intellettuale della piattaforma e dei moduli restano del fornitore.
      </p>

      <h2>6. Fatturazione</h2>
      <p>
        Il servizio è fatturato secondo quanto previsto dal contratto (canone annuale ed eventuali servizi/moduli
        aggiuntivi). Non è previsto pagamento automatico tramite la piattaforma.
      </p>

      <h2>7. Cessazione</h2>
      <p>
        Alla cessazione del contratto l&apos;accesso viene disattivato; l&apos;export completo dei dati resta disponibile
        su richiesta per 60 giorni.
      </p>

      <h2>8. Limitazione di responsabilità</h2>
      <p>
        Nei limiti consentiti dalla legge, il fornitore non è responsabile per danni indiretti. Le responsabilità
        sono disciplinate dal contratto.
      </p>
    </>
  );
}
