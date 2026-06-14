import type { Metadata } from "next";

export const metadata: Metadata = { title: "DPA — Coordinate" };

export default function DpaPage() {
  return (
    <>
      <h1>Accordo sul trattamento dei dati (DPA)</h1>
      <p className="!text-amber-600 dark:!text-amber-500">
        Bozza minimale — da far revisionare a un legale e firmare col cliente. Costituisce parte del contratto.
      </p>
      <p>Ultimo aggiornamento: giugno 2026.</p>

      <h2>1. Ruoli</h2>
      <p>
        Il cliente agisce come <strong>titolare</strong> del trattamento dei dati inseriti nella piattaforma; il
        fornitore di Coordinate agisce come <strong>responsabile</strong> del trattamento, trattando i dati solo
        secondo le istruzioni documentate del titolare.
      </p>

      <h2>2. Oggetto e durata</h2>
      <p>
        Il trattamento ha per oggetto i dati personali necessari all&apos;erogazione del servizio (contatti,
        utenti, contenuti dei moduli) per tutta la durata del contratto.
      </p>

      <h2>3. Misure di sicurezza</h2>
      <ul>
        <li>Isolamento dei dati per tenant tramite Row-Level Security sul database.</li>
        <li>Cifratura in transito (HTTPS) e password gestite con hashing.</li>
        <li>Controllo accessi basato su ruoli; verifica server-side dell&apos;appartenenza al tenant.</li>
        <li>Backup periodici e log degli accessi.</li>
      </ul>

      <h2>4. Sub-responsabili</h2>
      <p>Il fornitore si avvale dei seguenti sub-responsabili, tutti con dati in UE ove applicabile:</p>
      <ul>
        <li>Hosting applicativo (piattaforma cloud).</li>
        <li>Database gestito (PostgreSQL).</li>
        <li>Storage file (oggetti/allegati).</li>
        <li>Error tracking e analisi prodotto (se attivati).</li>
      </ul>

      <h2>5. Trasferimenti</h2>
      <p>I dati sono ospitati nell&apos;Unione Europea. Eventuali trasferimenti extra-UE sono soggetti a garanzie adeguate.</p>

      <h2>6. Assistenza al titolare</h2>
      <p>
        Il responsabile assiste il titolare nel rispondere alle richieste degli interessati (accesso, cancellazione,
        portabilità tramite export) e in caso di data breach, con notifica senza ingiustificato ritardo.
      </p>

      <h2>7. Cancellazione</h2>
      <p>
        Al termine del servizio, su scelta del titolare, i dati vengono restituiti (export) e quindi cancellati
        entro i termini previsti dalla privacy policy.
      </p>
    </>
  );
}
