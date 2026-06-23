import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer";

/**
 * Branded quote PDF. This module pulls in @react-pdf/renderer (heavy), so it is
 * imported dynamically from the editor only when the user clicks "Scarica PDF"
 * — it must never be in the initial bundle.
 */

export interface QuotePdfLine {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxRate: number;
}
export interface QuotePdfData {
  number: number;
  contactName: string;
  issueDate: string | Date;
  validUntil: string | Date | null;
  notes: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  lines: QuotePdfLine[];
}
export interface QuotePdfCompany {
  name: string;
  vat: string;
  taxCode: string;
  address: string;
}

const euro = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fdate = (d: string | Date) => new Date(d).toLocaleDateString("it-IT");
const lineNet = (l: QuotePdfLine) => l.quantity * l.unitPrice * (1 - l.discountPct / 100);

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.4 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4, lineHeight: 1.2 },
  muted: { color: "#666" },
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 6, lineHeight: 1.2 },
  section: { marginTop: 20 },
  label: { fontSize: 8, color: "#888", textTransform: "uppercase", marginBottom: 2 },

  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 4, marginBottom: 2 },
  tr: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#e0e0e0" },
  cDesc: { flex: 1 },
  cNum: { width: 55, textAlign: "right" },
  cMoney: { width: 75, textAlign: "right" },
  thText: { fontSize: 8, color: "#888", textTransform: "uppercase" },

  totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalGrand: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4, marginTop: 2, borderTopWidth: 1, borderTopColor: "#333" },
  bold: { fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 24, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: "#e0e0e0", color: "#444" },
});

export function QuoteDocument({ quote, company }: { quote: QuotePdfData; company: QuotePdfCompany }) {
  return (
    <Document title={`Preventivo ${quote.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header: emitter + document meta */}
        <View style={styles.spaceBetween}>
          <View style={{ maxWidth: 280 }}>
            <Text style={styles.companyName}>{company.name || "—"}</Text>
            {!!company.address && <Text style={styles.muted}>{company.address}</Text>}
            {!!company.vat && <Text style={styles.muted}>P.IVA {company.vat}</Text>}
            {!!company.taxCode && <Text style={styles.muted}>C.F. {company.taxCode}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>Preventivo</Text>
            <Text style={styles.bold}>#{quote.number}</Text>
            <Text style={styles.muted}>Data: {fdate(quote.issueDate)}</Text>
            {quote.validUntil && <Text style={styles.muted}>Valido fino al: {fdate(quote.validUntil)}</Text>}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={[styles.label, { textTransform: "none" }]}>Spett.le</Text>
          <Text style={styles.bold}>{quote.contactName}</Text>
        </View>

        {/* Lines */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.th}>
            <Text style={[styles.cDesc, styles.thText]}>Descrizione</Text>
            <Text style={[styles.cNum, styles.thText]}>Q.tà</Text>
            <Text style={[styles.cMoney, styles.thText]}>Prezzo</Text>
            <Text style={[styles.cNum, styles.thText]}>Sc.%</Text>
            <Text style={[styles.cNum, styles.thText]}>IVA%</Text>
            <Text style={[styles.cMoney, styles.thText]}>Imponibile</Text>
          </View>
          {quote.lines.map((l, i) => (
            <View key={i} style={styles.tr} wrap={false}>
              <Text style={styles.cDesc}>{l.description}</Text>
              <Text style={styles.cNum}>{l.quantity.toLocaleString("it-IT")}</Text>
              <Text style={styles.cMoney}>{euro(l.unitPrice)}</Text>
              <Text style={styles.cNum}>{l.discountPct ? `${l.discountPct}%` : "—"}</Text>
              <Text style={styles.cNum}>{l.taxRate}%</Text>
              <Text style={styles.cMoney}>{euro(lineNet(l))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Imponibile</Text>
            <Text>{euro(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>IVA</Text>
            <Text>{euro(quote.taxTotal)}</Text>
          </View>
          <View style={styles.totalGrand}>
            <Text style={styles.bold}>Totale</Text>
            <Text style={styles.bold}>{euro(quote.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {!!quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Note</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

/** Generate the quote PDF as a Blob in the browser. */
export async function createQuotePdfBlob(
  quote: QuotePdfData,
  company: QuotePdfCompany
): Promise<Blob> {
  return pdf(<QuoteDocument quote={quote} company={company} />).toBlob();
}

/** Generate the PDF and trigger a file download. */
export async function downloadQuotePdf(quote: QuotePdfData, company: QuotePdfCompany) {
  const blob = await createQuotePdfBlob(quote, company);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `preventivo-${quote.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later: some (mobile) browsers start the download asynchronously and
  // revoking immediately can abort it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
