import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Coordinate" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="!text-amber-600 dark:!text-amber-500">
        Bozza minimale — da far revisionare a un legale prima del go-live con dati reali.
      </p>
      <p>Ultimo aggiornamento: giugno 2026.</p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento è l&apos;azienda che eroga la piattaforma Coordinate. I recapiti completi
        sono indicati nel contratto e disponibili all&apos;indirizzo di supporto.
      </p>

      <h2>2. Dati trattati</h2>
      <ul>
        <li>Dati di account: nome, email, ruolo, credenziali (in forma cifrata).</li>
        <li>Dati inseriti nei moduli: contatti, anagrafiche, attività, preventivi, commesse, prodotti.</li>
        <li>Dati tecnici: log di accesso, indirizzo IP, dati di utilizzo per sicurezza e diagnostica.</li>
      </ul>

      <h2>3. Finalità e base giuridica</h2>
      <p>
        I dati sono trattati per erogare il servizio (esecuzione del contratto), per obblighi di legge e,
        ove attivati, per analisi statistiche interne sul prodotto sulla base del legittimo interesse o del consenso.
      </p>

      <h2>4. Conservazione</h2>
      <p>
        I dati sono conservati per la durata del contratto. Alla cessazione, l&apos;export completo è disponibile
        su richiesta per 60 giorni, dopodiché i dati vengono cancellati. Le cancellazioni applicano un periodo
        di soft-delete di 30 giorni prima della rimozione definitiva.
      </p>

      <h2>5. Dove sono i dati</h2>
      <p>I dati sono ospitati su infrastruttura nell&apos;Unione Europea (database e storage file in UE).</p>

      <h2>6. Diritti dell&apos;interessato</h2>
      <p>
        Hai diritto di accesso, rettifica, cancellazione, limitazione e portabilità dei dati. La portabilità è
        fornita tramite la funzione di export dati (ZIP CSV) disponibile nelle impostazioni del tenant, oppure
        su richiesta al supporto.
      </p>

      <h2>7. Responsabili e sub-responsabili</h2>
      <p>
        Per l&apos;erogazione del servizio ci avvaliamo di fornitori (hosting, database, storage, error tracking)
        che agiscono come responsabili del trattamento, vincolati da accordi adeguati. L&apos;elenco è disponibile
        nel <a className="text-primary hover:underline" href="/dpa">DPA</a>.
      </p>

      <h2>8. Contatti</h2>
      <p>Per esercitare i tuoi diritti o per domande sulla privacy, scrivi all&apos;indirizzo di supporto indicato nel contratto.</p>
    </>
  );
}
