"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Copy, Check, Users, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type Tenant = inferRouterOutputs<AppRouter>["admin"]["tenants"]["list"][number];

const PLANS = ["starter", "pro", "business"] as const;
const STATUSES = ["active", "suspended", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = { active: "Attivo", suspended: "Sospeso", cancelled: "Cancellato" };

export default function AdminPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const listOptions = trpc.admin.tenants.list.queryOptions();
  const { data: tenants, isLoading } = useQuery(listOptions);
  const { data: catalog = [] } = useQuery(trpc.admin.moduleCatalog.queryOptions());
  const invalidate = () => queryClient.invalidateQueries(listOptions);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aziende</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crea tenant, gestisci posti e moduli.</p>
        </div>
        <Button className="gap-1.5 shrink-0 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nuovo tenant
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !tenants?.length ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Nessun tenant. Creane uno.</p>
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <Card key={t.id} className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{t.name}</span>
                        <Badge variant={t.status === "active" ? "default" : "secondary"} className="shrink-0">
                          {STATUS_LABEL[t.status]}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="truncate">
                        /t/{t.slug} · {t.owner?.email ?? "—"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(t)}>
                      <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Modifica</span>
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      title="Elimina tenant"
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className={cn(t.seatsUsed >= t.maxSeats && "text-amber-600 dark:text-amber-500 font-medium")}>
                    {t.seatsUsed} / {t.maxSeats} posti
                  </span>
                </span>
                <span>Piano: <span className="text-foreground capitalize">{t.plan}</span></span>
                <span>{t.enabledModules.length} moduli attivi</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        catalog={catalog}
        onCreated={invalidate}
      />
      <EditTenantDialog
        tenant={editing}
        onClose={() => setEditing(null)}
        catalog={catalog}
        onSaved={invalidate}
      />
      <DeleteTenantDialog
        tenant={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={invalidate}
      />
    </div>
  );
}

// ── Create ──────────────────────────────────────────────────────────────────

function CreateTenantDialog({
  open, onOpenChange, catalog, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  catalog: readonly { id: string; label: string }[];
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("starter");
  const [maxSeats, setMaxSeats] = useState(2);
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ slug: string; ownerEmail: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setSlug(""); setName(""); setOwnerEmail(""); setOwnerName("");
    setPlan("starter"); setMaxSeats(2); setPassword(""); setCreated(null); setCopied(false);
  }

  const create = useMutation(
    trpc.admin.tenants.create.mutationOptions({
      onSuccess: (res) => {
        onCreated();
        setCreated({ slug: res.slug, ownerEmail: res.ownerEmail, password: res.generatedPassword });
        toast.success(`Tenant /t/${res.slug} creato.`);
      },
      onError: (e) => toast.error(e.message),
    })
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Tenant creato</DialogTitle>
              <DialogDescription>
                Consegna le credenziali a <strong>{created.ownerEmail}</strong> su un canale sicuro.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">URL:</span> /t/{created.slug}</div>
              <div><span className="text-muted-foreground">Email:</span> {created.ownerEmail}</div>
              {created.password ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono">{created.password}</span>
                  <Button
                    variant="outline" size="sm" className="gap-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(created.password!);
                      setCopied(true); setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiata" : "Copia"}
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground">Password: impostata manualmente / utente preesistente.</div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => { onOpenChange(false); reset(); }}>Fatto</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ slug, name, ownerEmail, ownerName, plan, maxSeats, password: password.trim() || undefined });
            }}
          >
            <DialogHeader>
              <DialogTitle>Nuovo tenant</DialogTitle>
              <DialogDescription>Crea un&apos;azienda con il suo account owner. Moduli di default attivi (modificabili dopo).</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-slug">Slug</Label>
                <Input id="t-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Ragione sociale</Label>
                <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme S.r.l." required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-oname">Nome owner</Label>
                <Input id="t-oname" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-omail">Email owner</Label>
                <Input id="t-omail" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Piano</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as (typeof PLANS)[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-seats">Posti (maxSeats)</Label>
                <Input
                  id="t-seats" type="number" min={1} value={maxSeats}
                  onChange={(e) => setMaxSeats(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="t-pass">Password <span className="text-muted-foreground font-normal">(vuoto = generata)</span></Label>
                <Input
                  id="t-pass" type="text" autoComplete="off" value={password}
                  placeholder="Lascia vuoto per generarla automaticamente"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">{catalog.length} moduli core verranno abilitati di default.</p>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); reset(); }}>Annulla</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creazione…" : "Crea tenant"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Edit ────────────────────────────────────────────────────────────────────

function EditTenantDialog({
  tenant, onClose, catalog, onSaved,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  catalog: readonly { id: string; label: string }[];
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const [maxSeats, setMaxSeats] = useState(2);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("active");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("starter");
  const [modules, setModules] = useState<string[]>([]);
  const [initId, setInitId] = useState<string | null>(null);

  // Initialise local form when a new tenant is opened.
  if (tenant && tenant.id !== initId) {
    setInitId(tenant.id);
    setMaxSeats(tenant.maxSeats);
    setStatus(tenant.status as (typeof STATUSES)[number]);
    setPlan(tenant.plan as (typeof PLANS)[number]);
    setModules(tenant.enabledModules);
  }

  const update = useMutation(
    trpc.admin.tenants.update.mutationOptions({
      onSuccess: () => { onSaved(); toast.success("Tenant aggiornato."); onClose(); },
      onError: (e) => toast.error(e.message),
    })
  );

  function toggleModule(id: string) {
    setModules((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => { if (!o) { onClose(); setInitId(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tenant?.name}</DialogTitle>
          <DialogDescription>/t/{tenant?.slug} — gestisci posti, stato, piano e moduli.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-seats">Posti</Label>
              <Input
                id="e-seats" type="number" min={1} value={maxSeats}
                onChange={(e) => setMaxSeats(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stato</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Piano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as (typeof PLANS)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Moduli</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {catalog.map((m) => {
                const on = modules.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                      on ? "border-primary/50 bg-primary/10" : "border-border/50 hover:bg-muted/40"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", on ? "bg-primary" : "bg-muted-foreground/40")} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onClose(); setInitId(null); }}>Annulla</Button>
          <Button
            disabled={update.isPending || !tenant}
            onClick={() => tenant && update.mutate({ tenantId: tenant.id, maxSeats, status, plan, enabledModules: modules })}
          >
            {update.isPending ? "Salvataggio…" : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete (archive to Blob, then delete) ─────────────────────────────────────

function DeleteTenantDialog({
  tenant, onClose, onDeleted,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const trpc = useTRPC();
  const [initId, setInitId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset local state when a new tenant opens.
  if (tenant && tenant.id !== initId) {
    setInitId(tenant.id);
    setConfirmText("");
    setArchiveUrl(null);
    setCopied(false);
  }

  function close() { setInitId(null); onClose(); }

  const del = useMutation(
    trpc.admin.tenants.delete.mutationOptions({
      onSuccess: (res) => {
        onDeleted();
        setArchiveUrl(res.archiveUrl);
        toast.success(`Tenant /t/${res.slug} archiviato ed eliminato.`);
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const canDelete = !!tenant && confirmText.trim() === tenant.slug;

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent>
        {archiveUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Tenant eliminato</DialogTitle>
              <DialogDescription>I dati sono stati archiviati su Blob prima della cancellazione. Conserva questo link.</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 flex items-center justify-between gap-2">
              <a href={archiveUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                Archivio ZIP
              </a>
              <Button
                variant="outline" size="sm" className="gap-1.5 shrink-0"
                onClick={() => { navigator.clipboard.writeText(archiveUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiato" : "Copia link"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={close}>Fatto</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Elimina {tenant?.name}
              </DialogTitle>
              <DialogDescription>
                I dati (CSV completo + elenco file su Blob) verranno <strong>archiviati su Blob</strong>, poi il tenant e i suoi dati nel
                database saranno <strong>cancellati definitivamente</strong>. I file già su Blob (foto, allegati) restano.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="del-confirm">
                Scrivi <code className="font-mono text-foreground">{tenant?.slug}</code> per confermare
              </Label>
              <Input
                id="del-confirm"
                value={confirmText}
                autoComplete="off"
                placeholder={tenant?.slug}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>Annulla</Button>
              <Button
                variant="destructive"
                disabled={!canDelete || del.isPending}
                onClick={() => tenant && del.mutate({ tenantId: tenant.id, confirmSlug: confirmText.trim() })}
              >
                {del.isPending ? "Archiviazione…" : "Archivia ed elimina"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
