"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Download, Hammer, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type QuoteStatus = inferRouterOutputs<AppRouter>["quotes"]["get"]["status"];

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Bozza", sent: "Inviato", accepted: "Accettato", rejected: "Rifiutato", expired: "Scaduto",
};
const STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

// Numeric line fields are kept as strings while editing so the inputs can be
// empty, accept a comma decimal separator, and not force a sticky "0".
type Line = { description: string; quantity: string; unitPrice: string; discountPct: string; taxRate: string };
type FormState = { contactId: string | null; contactName: string; validUntil: string; notes: string; lines: Line[] };

const emptyLine = (): Line => ({ description: "", quantity: "1", unitPrice: "", discountPct: "", taxRate: "22" });
const euro = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Parse a user-typed number (comma or dot, possibly empty) to a number. */
const num = (s: string) => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function lineNet(l: Line) {
  return num(l.quantity) * num(l.unitPrice) * (1 - num(l.discountPct) / 100);
}
function computeTotals(lines: Line[]) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const l of lines) {
    const net = lineNet(l);
    subtotal += net;
    taxTotal += net * (num(l.taxRate) / 100);
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

export default function QuoteEditorPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenant, id } = useParams<{ tenant: string; id: string }>();
  const base = `/t/${tenant}`;
  const isNew = id === "new";

  const getOptions = trpc.quotes.get.queryOptions({ id });
  const { data: quote } = useQuery({ ...getOptions, enabled: !isNew });
  const { data: contacts = [] } = useQuery(trpc.crm.contact.list.queryOptions());
  const { data: company } = useQuery(trpc.quotes.companyInfo.get.queryOptions());

  const [downloading, setDownloading] = useState(false);
  // The quote is previewed as in-app HTML (responsive — renders on every device);
  // the real PDF is only built on "Scarica". An <iframe> PDF preview rendered
  // blank on mobile browsers, which don't display PDFs inline.
  const [previewOpen, setPreviewOpen] = useState(false);

  async function downloadPdf() {
    if (!quote) return;
    setDownloading(true);
    try {
      const { downloadQuotePdf } = await import("@/lib/quote-pdf");
      await downloadQuotePdf(
        {
          number: quote.number,
          contactName: quote.contactName,
          issueDate: quote.issueDate,
          validUntil: quote.validUntil,
          notes: quote.notes,
          subtotal: quote.subtotal,
          taxTotal: quote.taxTotal,
          total: quote.total,
          lines: quote.lines,
        },
        company ?? { name: "", vat: "", taxCode: "", address: "" }
      );
    } catch {
      toast.error("Errore nella generazione del PDF.");
    } finally {
      setDownloading(false);
    }
  }

  const [form, setForm] = useState<FormState | null>(
    isNew ? { contactId: null, contactName: "", validUntil: "", notes: "", lines: [emptyLine()] } : null
  );

  // Hydrate the form once the quote loads (edit mode).
  if (!isNew && quote && form === null) {
    setForm({
      contactId: quote.contactId,
      contactName: quote.contactName,
      validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().slice(0, 10) : "",
      notes: quote.notes ?? "",
      lines: quote.lines.map((l) => ({
        description: l.description,
        quantity: String(l.quantity),
        unitPrice: String(l.unitPrice),
        discountPct: l.discountPct ? String(l.discountPct) : "",
        taxRate: String(l.taxRate),
      })),
    });
  }

  const onSaved = {
    onSuccess: () => {
      toast.success("Preventivo salvato.");
      queryClient.invalidateQueries(trpc.quotes.list.queryOptions());
      if (!isNew) queryClient.invalidateQueries(getOptions);
      router.push(`${base}/quotes`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const createMut = useMutation(trpc.quotes.create.mutationOptions(onSaved));
  const updateMut = useMutation(trpc.quotes.update.mutationOptions(onSaved));
  const saving = createMut.isPending || updateMut.isPending;

  const updateStatus = useMutation(
    trpc.quotes.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(getOptions);
        queryClient.invalidateQueries(trpc.quotes.list.queryOptions());
        toast.success("Stato aggiornato.");
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const createWorkOrder = useMutation(
    trpc.workOrders.create.mutationOptions({
      onSuccess: () => { toast.success("Commessa creata dal preventivo."); router.push(`${base}/work-orders`); },
      onError: (e) => toast.error(e.message),
    })
  );

  if (!form) {
    return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;
  }

  const totals = computeTotals(form.lines);
  const set = (patch: Partial<FormState>) => setForm({ ...form, ...patch });
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm({ ...form, lines: form.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });

  function submit() {
    if (!form) return;
    if (!form.contactName.trim()) { toast.error("Inserisci il cliente."); return; }
    const payload = {
      contactId: form.contactId,
      contactName: form.contactName.trim(),
      validUntil: form.validUntil ? form.validUntil : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
      lines: form.lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          quantity: num(l.quantity),
          unitPrice: num(l.unitPrice),
          discountPct: num(l.discountPct),
          taxRate: num(l.taxRate),
        })),
    };
    if (isNew) createMut.mutate(payload);
    else updateMut.mutate({ id, ...payload });
  }

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-3 shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <Link href={`${base}/quotes`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-4 w-4" /> Preventivi
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isNew ? "Nuovo preventivo" : `Preventivo #${quote?.number}`}
          </h2>
          {!isNew && quote && (
            <div className="flex flex-wrap items-center gap-2">
              {quote.status === "accepted" && (
                <Button
                  variant="outline" size="sm" className="gap-1.5"
                  disabled={createWorkOrder.isPending}
                  onClick={() => createWorkOrder.mutate({
                    title: `Da preventivo #${quote.number}`,
                    contactId: quote.contactId,
                    contactName: quote.contactName,
                    quoteId: quote.id,
                  })}
                >
                  <Hammer className="h-4 w-4" />
                  Crea commessa
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
                <FileText className="h-4 w-4" />
                Anteprima
              </Button>
              <Select value={quote.status} onValueChange={(v) => updateStatus.mutate({ id, status: v as QuoteStatus })}>
                <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Customer + validity */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select
              value={form.contactId ?? "free"}
              onValueChange={(v) => {
                if (v === "free") { set({ contactId: null }); return; }
                const c = contacts.find((x) => x.id === v);
                set({ contactId: v, contactName: c?.name ?? form.contactName });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Scegli un contatto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Cliente libero (testo)</SelectItem>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-cname">Intestazione cliente</Label>
            <Input id="q-cname" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} placeholder="Ragione sociale / nome" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-valid">Valido fino al</Label>
            <Input id="q-valid" type="date" value={form.validUntil} onChange={(e) => set({ validUntil: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm font-medium">Righe</span>
          <Button size="sm" variant="outline" onClick={() => set({ lines: [...form.lines, emptyLine()] })}>
            <Plus className="mr-1.5 h-4 w-4" /> Aggiungi riga
          </Button>
        </div>
        <div className="divide-y divide-border/40">
          {form.lines.map((l, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <Input
                  className="h-9 flex-1 min-w-0"
                  placeholder="Descrizione (materiale / lavorazione)"
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => set({ lines: form.lines.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Quantità</label>
                  <Input className="h-9 text-right" inputMode="decimal" placeholder="0" value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Prezzo €</label>
                  <Input className="h-9 text-right" inputMode="decimal" placeholder="0,00" value={l.unitPrice}
                    onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Sconto %</label>
                  <Input className="h-9 text-right" inputMode="decimal" placeholder="0" value={l.discountPct}
                    onChange={(e) => setLine(i, { discountPct: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">IVA %</label>
                  <Input className="h-9 text-right" inputMode="decimal" placeholder="22" value={l.taxRate}
                    onChange={(e) => setLine(i, { taxRate: e.target.value })} />
                </div>
              </div>
              <div className="text-right text-sm">
                <span className="text-muted-foreground">Imponibile riga: </span>
                <span className="font-medium tabular-nums">{euro(lineNet(l))}</span>
              </div>
            </div>
          ))}
          {form.lines.length === 0 && (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">Nessuna riga. Aggiungine una.</p>
          )}
        </div>
        {/* Totals */}
        <div className="border-t border-border/50 px-4 py-3 flex justify-end">
          <div className="w-full max-w-[260px] space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Imponibile</span><span className="tabular-nums">{euro(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span className="tabular-nums">{euro(totals.taxTotal)}</span></div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-border/40"><span>Totale</span><span className="tabular-nums">{euro(totals.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Notes + save */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="q-notes">Note</Label>
          <textarea
            id="q-notes"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Condizioni, tempi di consegna, modalità di pagamento…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push(`${base}/quotes`)}>Annulla</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvataggio…" : "Salva preventivo"}
          </Button>
        </div>
      </div>

      {/* In-app HTML preview — responsive, renders on every device (mobile
          browsers don't show PDFs in an iframe). The real PDF is built on download. */}
      {previewOpen && quote && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 p-3 shrink-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(false)}>
              <ArrowLeft className="h-4 w-4" /> Indietro
            </Button>
            <span className="text-sm font-medium truncate">Preventivo #{quote.number}</span>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={downloading} onClick={downloadPdf}>
              <Download className="h-4 w-4" /> {downloading ? "PDF…" : "Scarica PDF"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/30 p-3 sm:p-6">
            {/* aspect-[210/297] = A4 proportions, so a short quote still looks
                like a full page (whitespace below) and not a tight card; grows
                past the page for long quotes (min-height: auto). */}
            <div className="mx-auto flex aspect-[210/297] max-w-2xl flex-col rounded-lg bg-white p-5 text-sm text-neutral-900 shadow-lg sm:p-10">
              {/* Header: emittente + meta documento */}
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-snug">{company?.name || "—"}</p>
                  {company?.address && <p className="text-neutral-500">{company.address}</p>}
                  {company?.vat && <p className="text-neutral-500">P.IVA {company.vat}</p>}
                  {company?.taxCode && <p className="text-neutral-500">C.F. {company.taxCode}</p>}
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-bold leading-snug">Preventivo</p>
                  <p className="font-semibold">#{quote.number}</p>
                  <p className="mt-1 text-neutral-500">Data: {format(new Date(quote.issueDate), "dd/MM/yyyy", { locale: it })}</p>
                  {quote.validUntil && (
                    <p className="text-neutral-500">Valido fino al: {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: it })}</p>
                  )}
                </div>
              </div>

              {/* Destinatario */}
              <div className="mt-6">
                <p className="text-[11px] tracking-wide text-neutral-400">Spett.le</p>
                <p className="font-semibold">{quote.contactName}</p>
              </div>

              {/* Righe */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-800 text-left text-[11px] uppercase text-neutral-400">
                      <th className="py-2 pr-2 font-medium">Descrizione</th>
                      <th className="py-2 px-2 text-right font-medium">Q.tà</th>
                      <th className="py-2 px-2 text-right font-medium">Prezzo</th>
                      <th className="py-2 px-2 text-right font-medium">Sc.%</th>
                      <th className="py-2 px-2 text-right font-medium">IVA%</th>
                      <th className="py-2 pl-2 text-right font-medium">Imponibile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lines.map((l, i) => (
                      <tr key={i} className="border-b border-neutral-200">
                        <td className="py-2 pr-2">{l.description}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{l.quantity.toLocaleString("it-IT")}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{euro(l.unitPrice)}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{l.discountPct ? `${l.discountPct}%` : "—"}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{l.taxRate}%</td>
                        <td className="py-2 pl-2 text-right tabular-nums">
                          {euro(l.quantity * l.unitPrice * (1 - l.discountPct / 100))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totali */}
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-[260px] space-y-1">
                  <div className="flex justify-between text-neutral-600"><span>Imponibile</span><span className="tabular-nums">{euro(quote.subtotal)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>IVA</span><span className="tabular-nums">{euro(quote.taxTotal)}</span></div>
                  <div className="flex justify-between border-t-2 border-neutral-800 pt-1 text-base font-bold"><span>Totale</span><span className="tabular-nums">{euro(quote.total)}</span></div>
                </div>
              </div>

              {/* Note */}
              {quote.notes && (
                <div className="mt-8 border-t border-neutral-200 pt-3">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-400">Note</p>
                  <p className="whitespace-pre-wrap text-neutral-700">{quote.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
