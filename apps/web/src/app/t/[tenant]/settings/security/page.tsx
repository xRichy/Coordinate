"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import {
  ArrowLeft, ShieldCheck, ShieldAlert, Lock, Copy, Check, Download, KeyRound,
} from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";

/** Pulls the base32 secret out of an otpauth:// URI so the user can type it in manually. */
function secretFromUri(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get("secret");
  } catch {
    return /[?&]secret=([^&]+)/.exec(uri)?.[1] ?? null;
  }
}

export default function SecurityPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { tenant } = useParams<{ tenant: string }>();
  const base = `/t/${tenant}`;

  const membershipOptions = trpc.onboarding.getMyMembership.queryOptions();
  const { data: membership, isLoading } = useQuery(membershipOptions);
  const enabled = membership?.twoFactorEnabled ?? false;
  const isOwner = membership?.role === "owner";
  const refreshStatus = () => queryClient.invalidateQueries(membershipOptions);

  // ── Enrollment dialog ──────────────────────────────────────────────────────
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [stage, setStage] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function resetEnroll() {
    setStage("password"); setPassword(""); setTotpUri(""); setBackupCodes([]); setCode(""); setBusy(false); setCopied(false);
  }

  async function startEnroll() {
    setBusy(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Password non corretta.");
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes ?? []);
    setStage("verify");
  }

  async function confirmEnroll() {
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: code.trim() });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Codice non valido. Riprova.");
      return;
    }
    toast.success("Verifica in due passaggi attivata.");
    setEnrollOpen(false);
    resetEnroll();
    refreshStatus();
  }

  // ── Disable dialog ───────────────────────────────────────────────────────
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  async function confirmDisable() {
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({ password: disablePassword });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Password non corretta.");
      return;
    }
    toast.success("Verifica in due passaggi disattivata.");
    setDisableOpen(false);
    setDisablePassword("");
    refreshStatus();
  }

  // ── Regenerate backup codes dialog ────────────────────────────────────────
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);

  async function confirmRegen() {
    setBusy(true);
    const { data, error } = await authClient.twoFactor.generateBackupCodes({ password: regenPassword });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Password non corretta.");
      return;
    }
    setRegenCodes(data.backupCodes ?? []);
    setRegenPassword("");
  }

  function copyCodes(codes: string[]) {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadCodes(codes: string[]) {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coordinate-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const secret = totpUri ? secretFromUri(totpUri) : null;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3 shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <Link href={`${base}/settings`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-4 w-4" /> Impostazioni
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sicurezza</h2>
          <p className="text-muted-foreground mt-2">Proteggi il tuo account con la verifica in due passaggi (2FA).</p>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              )}
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  Verifica in due passaggi
                  {!isLoading && (
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "Attiva" : "Non attiva"}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Un codice temporaneo dall&apos;app authenticator (Google Authenticator, Authy…) oltre alla password.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-40 rounded-lg" />
          ) : enabled ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => { setRegenCodes(null); setRegenPassword(""); setRegenOpen(true); }}>
                <KeyRound className="h-4 w-4" /> Rigenera codici di backup
              </Button>
              <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => { setDisablePassword(""); setDisableOpen(true); }}>
                <ShieldAlert className="h-4 w-4" /> Disattiva 2FA
              </Button>
            </div>
          ) : (
            <>
              {isOwner && (
                <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                  <Lock className="h-3.5 w-3.5" />
                  Come proprietario dell&apos;azienda, l&apos;attivazione della 2FA è obbligatoria.
                </p>
              )}
              <Button className="gap-1.5" onClick={() => { resetEnroll(); setEnrollOpen(true); }}>
                <ShieldCheck className="h-4 w-4" /> Attiva 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enrollment dialog */}
      <Dialog open={enrollOpen} onOpenChange={(o) => { setEnrollOpen(o); if (!o) resetEnroll(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {stage === "password" ? (
            <form onSubmit={(e) => { e.preventDefault(); startEnroll(); }}>
              <DialogHeader>
                <DialogTitle>Attiva la verifica in due passaggi</DialogTitle>
                <DialogDescription>Conferma la tua password per iniziare.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-4">
                <Label htmlFor="tf-pass">Password</Label>
                <Input id="tf-pass" type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setEnrollOpen(false); resetEnroll(); }}>Annulla</Button>
                <Button type="submit" disabled={busy || !password}>{busy ? "Verifica…" : "Continua"}</Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); confirmEnroll(); }}>
              <DialogHeader>
                <DialogTitle>Scansiona e conferma</DialogTitle>
                <DialogDescription>
                  Inquadra il QR con la tua app authenticator, poi inserisci il codice a 6 cifre per confermare.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {totpUri && (
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-white p-3">
                      <QRCode value={totpUri} size={160} />
                    </div>
                  </div>
                )}
                {secret && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Oppure inserisci la chiave manualmente</Label>
                    <code className="block break-all rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs font-mono">{secret}</code>
                  </div>
                )}

                {backupCodes.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                      Salva questi codici di backup: ti permettono di accedere se perdi il telefono. Sono mostrati una sola volta.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                      {backupCodes.map((c) => <div key={c} className="rounded bg-background/60 px-2 py-1">{c}</div>)}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => copyCodes(backupCodes)}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copiati" : "Copia"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => downloadCodes(backupCodes)}>
                        <Download className="h-3.5 w-3.5" /> Scarica
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="tf-code">Codice a 6 cifre</Label>
                  <Input
                    id="tf-code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setEnrollOpen(false); resetEnroll(); }}>Annulla</Button>
                <Button type="submit" disabled={busy || code.length < 6}>{busy ? "Verifica…" : "Conferma e attiva"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={disableOpen} onOpenChange={(o) => { setDisableOpen(o); if (!o) setDisablePassword(""); }}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); confirmDisable(); }}>
            <DialogHeader>
              <DialogTitle>Disattiva la verifica in due passaggi</DialogTitle>
              <DialogDescription>Conferma la password. Il tuo account resterà protetto solo dalla password.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-4">
              <Label htmlFor="tf-dis-pass">Password</Label>
              <Input id="tf-dis-pass" type="password" value={disablePassword} autoComplete="current-password" onChange={(e) => setDisablePassword(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setDisableOpen(false); setDisablePassword(""); }}>Annulla</Button>
              <Button type="submit" variant="destructive" disabled={busy || !disablePassword}>{busy ? "…" : "Disattiva"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Regenerate backup codes dialog */}
      <Dialog open={regenOpen} onOpenChange={(o) => { setRegenOpen(o); if (!o) { setRegenPassword(""); setRegenCodes(null); } }}>
        <DialogContent>
          {regenCodes ? (
            <>
              <DialogHeader>
                <DialogTitle>Nuovi codici di backup</DialogTitle>
                <DialogDescription>I codici precedenti non sono più validi. Salva questi: sono mostrati una sola volta.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-1.5 py-2 font-mono text-xs">
                {regenCodes.map((c) => <div key={c} className="rounded bg-muted/40 px-2 py-1">{c}</div>)}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="gap-1.5" onClick={() => copyCodes(regenCodes)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiati" : "Copia"}
                </Button>
                <Button type="button" variant="outline" className="gap-1.5" onClick={() => downloadCodes(regenCodes)}>
                  <Download className="h-4 w-4" /> Scarica
                </Button>
                <Button onClick={() => { setRegenOpen(false); setRegenCodes(null); }}>Fatto</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); confirmRegen(); }}>
              <DialogHeader>
                <DialogTitle>Rigenera codici di backup</DialogTitle>
                <DialogDescription>Conferma la password. I codici di backup attuali verranno invalidati.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-4">
                <Label htmlFor="tf-regen-pass">Password</Label>
                <Input id="tf-regen-pass" type="password" value={regenPassword} autoComplete="current-password" onChange={(e) => setRegenPassword(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setRegenOpen(false); setRegenPassword(""); }}>Annulla</Button>
                <Button type="submit" disabled={busy || !regenPassword}>{busy ? "…" : "Rigenera"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
