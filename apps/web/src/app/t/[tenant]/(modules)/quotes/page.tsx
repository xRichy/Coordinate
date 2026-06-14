"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { FileText, Plus, Building2, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useTRPC } from "@/lib/trpc";
import { useCan } from "@/hooks/useCan";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type QuoteStatus = inferRouterOutputs<AppRouter>["quotes"]["list"][number]["status"];

const STATUS_META: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Bozza", variant: "secondary" },
  sent: { label: "Inviato", variant: "default" },
  accepted: { label: "Accettato", variant: "default" },
  rejected: { label: "Rifiutato", variant: "destructive" },
  expired: { label: "Scaduto", variant: "outline" },
};

const euro = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotesPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenant } = useParams<{ tenant: string }>();
  const base = `/t/${tenant}`;

  const listOptions = trpc.quotes.list.queryOptions();
  const { data: quotes = [], isLoading } = useQuery(listOptions);

  const del = useMutation(
    trpc.quotes.delete.mutationOptions({
      onSuccess: () => { queryClient.invalidateQueries(listOptions); toast.success("Preventivo eliminato."); },
      onError: (e) => toast.error(e.message),
    })
  );

  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Preventivi</h2>
          <p className="text-muted-foreground">Offerte a righe con totali e IVA.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setCompanyOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" /> Dati azienda
          </Button>
          <Button onClick={() => router.push(`${base}/quotes/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Nuovo preventivo
          </Button>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nessun preventivo ancora.</p>
            <Button variant="outline" size="sm" onClick={() => router.push(`${base}/quotes/new`)}>
              <Plus className="mr-2 h-4 w-4" /> Crea il primo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>N°</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Validità</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow
                  key={q.id}
                  className="border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`${base}/quotes/${q.id}`)}
                >
                  <TableCell className="font-mono font-medium">#{q.number}</TableCell>
                  <TableCell>{q.contactName}</TableCell>
                  <TableCell className="text-sm">{format(new Date(q.issueDate), "d MMM yyyy", { locale: it })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {q.validUntil ? format(new Date(q.validUntil), "d MMM yyyy", { locale: it }) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_META[q.status].variant}>{STATUS_META[q.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{euro(q.total)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={del.isPending}
                      onClick={() => { if (confirm(`Eliminare il preventivo #${q.number}?`)) del.mutate({ id: q.id }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CompanyInfoDialog open={companyOpen} onOpenChange={setCompanyOpen} />
    </div>
  );
}

function CompanyInfoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const canEdit = useCan("tenant:settings:write");

  const opts = trpc.quotes.companyInfo.get.queryOptions();
  const { data } = useQuery(opts);

  const [edited, setEdited] = useState<{ name: string; vat: string; taxCode: string; address: string } | null>(null);
  const form = edited ?? data ?? { name: "", vat: "", taxCode: "", address: "" };

  const save = useMutation(
    trpc.quotes.companyInfo.set.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(opts);
        toast.success("Dati azienda salvati.");
        setEdited(null);
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message),
    })
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setEdited(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dati azienda emittente</DialogTitle>
          <DialogDescription>Compaiono in testata ai preventivi (e ai futuri documenti).</DialogDescription>
        </DialogHeader>
        {!canEdit && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Solo owner e admin possono modificare.
          </p>
        )}
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Ragione sociale</Label>
            <Input id="c-name" value={form.name} disabled={!canEdit}
              onChange={(e) => setEdited({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-vat">P.IVA</Label>
              <Input id="c-vat" value={form.vat} disabled={!canEdit}
                onChange={(e) => setEdited({ ...form, vat: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-cf">Codice Fiscale</Label>
              <Input id="c-cf" value={form.taxCode} disabled={!canEdit}
                onChange={(e) => setEdited({ ...form, taxCode: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-addr">Indirizzo</Label>
            <Input id="c-addr" value={form.address} disabled={!canEdit}
              onChange={(e) => setEdited({ ...form, address: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); setEdited(null); }}>Chiudi</Button>
          <Button disabled={!canEdit || save.isPending || !edited} onClick={() => save.mutate(form)}>
            {save.isPending ? "Salvataggio…" : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
