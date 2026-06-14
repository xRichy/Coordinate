"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Blocks, Lock, Users, ChevronRight, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/lib/trpc";
import { useCan } from "@/hooks/useCan";

function Toggle({
  checked, disabled, onClick,
}: { checked: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const canEdit = useCan("tenant:settings:write");

  const modulesOptions = trpc.tenant.modules.list.queryOptions();
  const { data, isLoading } = useQuery(modulesOptions);

  // `edited` is null until the user changes something, then derives from server data.
  const [edited, setEdited] = useState<string[] | null>(null);
  const enabled = edited ?? data?.enabled ?? [];

  const save = useMutation(
    trpc.tenant.modules.setEnabled.mutationOptions({
      onSuccess: () => {
        toast.success("Moduli aggiornati.");
        setEdited(null);  // ri-deriva dai dati server
        router.refresh(); // re-render del layout server → sidebar aggiornata
      },
      onError: () => toast.error("Errore: servono permessi owner/admin."),
    })
  );

  const exportData = useMutation(
    trpc.gdpr.exportData.mutationOptions({
      onSuccess: (res) => {
        const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Export generato.");
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const dirty =
    edited !== null &&
    !!data &&
    JSON.stringify([...edited].sort()) !== JSON.stringify([...data.enabled].sort());

  function toggle(id: string) {
    setEdited((cur) => {
      const base = cur ?? data?.enabled ?? [];
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Impostazioni</h2>
          <p className="text-muted-foreground mt-2">Configura i moduli attivi per questo tenant.</p>
        </div>
      </div>

      <Link href={`/t/${tenant}/settings/team`} className="block">
        <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm hover:bg-card/60 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Team</CardTitle>
                  <CardDescription>Gestisci gli account della tua azienda e i loro ruoli.</CardDescription>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
        </Card>
      </Link>

      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Blocks className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Moduli</CardTitle>
                <CardDescription>Attiva o disattiva i moduli visibili in questo tenant.</CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={!dirty || !canEdit || save.isPending}
              onClick={() => save.mutate({ modules: enabled })}
            >
              <Save className="h-4 w-4" />
              {save.isPending ? "Salvataggio…" : "Salva"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {!canEdit && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Lock className="h-3.5 w-3.5" />
              Solo owner e admin possono modificare i moduli.
            </p>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : (
            data?.catalog.map((m) => {
              const isOn = enabled.includes(m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  </div>
                  <Toggle checked={isOn} disabled={!canEdit} onClick={() => toggle(m.id)} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Privacy &amp; dati</CardTitle>
                <CardDescription>Esporta tutti i dati del tenant (GDPR) e consulta le informative.</CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              disabled={!canEdit || exportData.isPending}
              onClick={() => exportData.mutate()}
            >
              <Download className="h-4 w-4" />
              {exportData.isPending ? "Esportazione…" : "Esporta dati (ZIP)"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!canEdit && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Lock className="h-3.5 w-3.5" /> Solo owner e admin possono esportare i dati.
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/privacy" className="text-primary hover:underline">Privacy policy</Link>
            <Link href="/terms" className="text-primary hover:underline">Termini di servizio</Link>
            <Link href="/dpa" className="text-primary hover:underline">DPA</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
