"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, UserPlus, Trash2, Lock, Copy, Check } from "lucide-react";
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
import { useTRPC } from "@/lib/trpc";
import { useCan } from "@/hooks/useCan";

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietario",
  admin: "Amministratore",
  member: "Membro",
  viewer: "Visualizzatore",
};
const ASSIGNABLE_ROLES = ["admin", "member", "viewer"] as const;

export default function TeamPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { tenant } = useParams<{ tenant: string }>();
  const base = `/t/${tenant}`;

  const canInvite = useCan("tenant:members:invite");
  const canEditRole = useCan("tenant:members:role:edit");
  const canRemove = useCan("tenant:members:remove");

  const listOptions = trpc.team.list.queryOptions();
  const { data, isLoading } = useQuery(listOptions);
  const invalidate = () => queryClient.invalidateQueries(listOptions);

  const full = !!data && data.seatsUsed >= data.maxSeats;

  // ── Create dialog state ──────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>("member");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setName(""); setEmail(""); setRole("member"); setPassword(""); setCreated(null); setCopied(false);
  }

  const createMember = useMutation(
    trpc.team.createMember.mutationOptions({
      onSuccess: (res) => {
        invalidate();
        if (res.generatedPassword) {
          setCreated({ email: res.email, password: res.generatedPassword });
        } else {
          toast.success(`Account creato per ${res.email}.`);
          setOpen(false);
          resetForm();
        }
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const updateRole = useMutation(
    trpc.team.updateRole.mutationOptions({
      onSuccess: () => { invalidate(); toast.success("Ruolo aggiornato."); },
      onError: (e) => toast.error(e.message),
    })
  );

  const removeMember = useMutation(
    trpc.team.removeMember.mutationOptions({
      onSuccess: () => { invalidate(); toast.success("Account rimosso."); },
      onError: (e) => toast.error(e.message),
    })
  );

  function copyPassword() {
    if (!created?.password) return;
    navigator.clipboard.writeText(created.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3 shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <Link href={`${base}/settings`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-4 w-4" /> Impostazioni
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground mt-2">Gestisci gli account della tua azienda e i loro ruoli.</p>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  {data ? `${data.seatsUsed} / ${data.maxSeats} posti utilizzati` : "Membri del tenant"}
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={!canInvite || full}
              onClick={() => { resetForm(); setOpen(true); }}
            >
              <UserPlus className="h-4 w-4" />
              Crea account
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {!canInvite && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Lock className="h-3.5 w-3.5" />
              Solo owner e admin possono gestire il team.
            </p>
          )}
          {canInvite && full && (
            <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 mb-3">
              <Lock className="h-3.5 w-3.5" />
              Hai raggiunto il limite di {data?.maxSeats} account. Contattaci per aggiungere posti.
            </p>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : (
            data?.members.map((m) => {
              const isOwner = m.role === "owner";
              const rowEditable = canEditRole && !isOwner && !m.isSelf;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.name} {m.isSelf && <span className="text-muted-foreground font-normal">(tu)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rowEditable ? (
                      <Select
                        value={m.role}
                        onValueChange={(value) => updateRole.mutate({ membershipId: m.id, role: value as "admin" | "member" | "viewer" })}
                      >
                        <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={isOwner ? "default" : "secondary"}>{ROLE_LABEL[m.role]}</Badge>
                    )}
                    {canRemove && !isOwner && !m.isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={removeMember.isPending}
                        onClick={() => {
                          if (confirm(`Rimuovere l'account di ${m.email}? Libererà un posto.`)) {
                            removeMember.mutate({ membershipId: m.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Create account dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          {created ? (
            <>
              <DialogHeader>
                <DialogTitle>Account creato</DialogTitle>
                <DialogDescription>
                  Consegna queste credenziali a <strong>{created.email}</strong> su un canale sicuro.
                  La password è mostrata solo ora.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
                <div className="text-sm"><span className="text-muted-foreground">Email:</span> {created.email}</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-mono">{created.password}</div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={copyPassword}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiata" : "Copia"}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setOpen(false); resetForm(); }}>Fatto</Button>
              </DialogFooter>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMember.mutate({
                  name,
                  email,
                  role,
                  password: password.trim() ? password : undefined,
                });
              }}
            >
              <DialogHeader>
                <DialogTitle>Crea account</DialogTitle>
                <DialogDescription>
                  Crea un account legato alla tua azienda. Se lasci la password vuota, ne genereremo una temporanea da consegnare.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-name">Nome</Label>
                  <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-email">Email</Label>
                  <Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Ruolo</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as (typeof ASSIGNABLE_ROLES)[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-pass">Password <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
                  <Input
                    id="m-pass" type="text" value={password} autoComplete="off"
                    placeholder="Lascia vuoto per generarla"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Annulla</Button>
                <Button type="submit" disabled={createMember.isPending}>
                  {createMember.isPending ? "Creazione…" : "Crea account"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
