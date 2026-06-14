"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Pencil, Trash2, CalendarClock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];
type WoStatus = WorkOrder["status"];

const COLUMNS: { status: WoStatus; label: string }[] = [
  { status: "todo", label: "Da fare" },
  { status: "in_progress", label: "In lavorazione" },
  { status: "done", label: "Completata" },
  { status: "delivered", label: "Consegnata" },
];
const STATUS_LABEL: Record<WoStatus, string> = {
  todo: "Da fare", in_progress: "In lavorazione", done: "Completata", delivered: "Consegnata",
};

export default function WorkOrdersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listOptions = trpc.workOrders.list.queryOptions();
  const { data: items = [], isLoading } = useQuery(listOptions);
  const invalidate = () => queryClient.invalidateQueries(listOptions);

  const updateStatus = useMutation(
    trpc.workOrders.updateStatus.mutationOptions({ onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  );
  const del = useMutation(
    trpc.workOrders.delete.mutationOptions({
      onSuccess: () => { invalidate(); toast.success("Commessa eliminata."); },
      onError: (e) => toast.error(e.message),
    })
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);

  const today = startOfDay(new Date());
  const isOverdue = (w: WorkOrder) =>
    !!w.dueDate && (w.status === "todo" || w.status === "in_progress") && isBefore(new Date(w.dueDate), today);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Commesse</h2>
          <p className="text-muted-foreground">Ordini di lavoro: stato e scadenze.</p>
        </div>
        <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuova commessa
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colItems = items.filter((w) => w.status === col.status);
            return (
              <div key={col.status} className="bg-card/30 border border-border/50 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary">{colItems.length}</Badge>
                </div>
                {colItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1 py-6 text-center">—</p>
                ) : (
                  colItems.map((w) => {
                    const overdue = isOverdue(w);
                    return (
                      <Card key={w.id} className="p-3 space-y-2 bg-background/60 border-border/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{w.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              #{w.number} · {w.contactName}{w.quantity ? ` · ${w.quantity} pz` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 -mr-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditing(w)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={del.isPending}
                              onClick={() => { if (confirm(`Eliminare la commessa #${w.number}?`)) del.mutate({ id: w.id }); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {w.dueDate && (
                          <div className={cn("flex items-center gap-1.5 text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                            {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                            {format(new Date(w.dueDate), "d MMM yyyy", { locale: it })}
                            {overdue && " · in ritardo"}
                          </div>
                        )}
                        <Select value={w.status} onValueChange={(v) => updateStatus.mutate({ id: w.id, status: v as WoStatus })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((c) => <SelectItem key={c.status} value={c.status}>{STATUS_LABEL[c.status]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Card>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}

      <WorkOrderModal open={createOpen} onClose={() => setCreateOpen(false)} initial={null} onSaved={invalidate} />
      <WorkOrderModal open={!!editing} onClose={() => setEditing(null)} initial={editing} onSaved={invalidate} />
    </div>
  );
}

// ── Create / edit modal ───────────────────────────────────────────────────────

function WorkOrderModal({
  open, onClose, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: WorkOrder | null;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const { data: contacts = [] } = useQuery(trpc.crm.contact.list.queryOptions());

  const [initId, setInitId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Sync local form when the dialog opens for a (different) work order.
  const key = initial?.id ?? "new";
  if (open && key !== initId) {
    setInitId(key);
    setTitle(initial?.title ?? "");
    setContactId(initial?.contactId ?? null);
    setContactName(initial?.contactName ?? "");
    setQuantity(initial?.quantity != null ? String(initial.quantity) : "");
    setDueDate(initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : "");
    setNotes(initial?.notes ?? "");
  }

  function close() { setInitId(null); onClose(); }

  const createMut = useMutation(
    trpc.workOrders.create.mutationOptions({
      onSuccess: () => { onSaved(); toast.success("Commessa creata."); close(); },
      onError: (e) => toast.error(e.message),
    })
  );
  const updateMut = useMutation(
    trpc.workOrders.update.mutationOptions({
      onSuccess: () => { onSaved(); toast.success("Commessa aggiornata."); close(); },
      onError: (e) => toast.error(e.message),
    })
  );
  const saving = createMut.isPending || updateMut.isPending;

  function submit() {
    if (!title.trim()) { toast.error("Inserisci il titolo."); return; }
    if (!contactName.trim()) { toast.error("Inserisci il cliente."); return; }
    const payload = {
      title: title.trim(),
      contactId,
      contactName: contactName.trim(),
      quantity: quantity.trim() ? Math.max(1, parseInt(quantity, 10) || 1) : null,
      dueDate: dueDate ? dueDate : null,
      notes: notes.trim() ? notes.trim() : null,
    };
    if (initial) updateMut.mutate({ id: initial.id, ...payload });
    else createMut.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? `Commessa #${initial.number}` : "Nuova commessa"}</DialogTitle>
          <DialogDescription>Lavorazione su commessa: cliente, scadenza e stato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="wo-title">Titolo / lavorazione</Label>
            <Input id="wo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Tornitura 50 flange DN80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select
                value={contactId ?? "free"}
                onValueChange={(v) => {
                  if (v === "free") { setContactId(null); return; }
                  const c = contacts.find((x) => x.id === v);
                  setContactId(v); setContactName(c?.name ?? contactName);
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
              <Label htmlFor="wo-cname">Intestazione cliente</Label>
              <Input id="wo-cname" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-qty">Quantità <span className="text-muted-foreground font-normal">(opz.)</span></Label>
              <Input id="wo-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-due">Scadenza <span className="text-muted-foreground font-normal">(opz.)</span></Label>
              <Input id="wo-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wo-notes">Note</Label>
            <textarea
              id="wo-notes"
              className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Materiali, disegni, tolleranze…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>Annulla</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvataggio…" : initial ? "Salva" : "Crea commessa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
