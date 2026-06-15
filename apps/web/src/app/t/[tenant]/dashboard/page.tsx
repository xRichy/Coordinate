"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CircleDollarSign, Trophy, Target, Clock, UserPlus, Package, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc";

type Period = "month" | "quarter" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Questo mese",
  quarter: "Questo trimestre",
  year: "Quest'anno",
  all: "Sempre",
};

const eur = (n: number) => `€ ${Math.round(n).toLocaleString("it-IT")}`;

export default function DashboardPage() {
  const trpc = useTRPC();
  const { tenant } = useParams<{ tenant: string }>();
  const base = `/t/${tenant}`;

  const [period, setPeriod] = useState<Period>("month");
  const [ownerId, setOwnerId] = useState<string>("all");

  const { data: stats, isLoading } = useQuery(
    trpc.dashboard.stats.queryOptions({
      period,
      ownerId: ownerId === "all" ? undefined : ownerId,
    })
  );
  const { data: members = [] } = useQuery(trpc.crm.contact.listMembers.queryOptions());

  const periodLabel = PERIOD_LABELS[period].toLowerCase();

  const widgets = [
    {
      label: "Pipeline aperta",
      icon: CircleDollarSign,
      value: stats ? eur(stats.openPipeline.value) : "—",
      sub: stats ? `${stats.openPipeline.count} deal aperti` : "",
      href: `${base}/crm/leads`,
    },
    {
      label: `Vinti · ${periodLabel}`,
      icon: Trophy,
      value: stats ? eur(stats.won.value) : "—",
      sub: stats ? `${stats.won.count} deal vinti` : "",
      href: `${base}/crm/leads`,
    },
    {
      label: "Lead attivi",
      icon: Target,
      value: stats ? String(stats.activeLeads.count) : "—",
      sub: stats ? `${eur(stats.activeLeads.value)} in pipeline` : "",
      href: `${base}/crm/leads`,
    },
    {
      label: "Task in scadenza",
      icon: Clock,
      value: stats ? String(stats.dueTasks.count) : "—",
      sub: "entro 7 giorni",
      href: `${base}/tasks`,
    },
    {
      label: `Nuovi contatti · ${periodLabel}`,
      icon: UserPlus,
      value: stats ? String(stats.newContacts.count) : "—",
      sub: "nel periodo selezionato",
      href: `${base}/crm/customers`,
    },
    {
      label: "Valore magazzino",
      icon: Package,
      value: stats ? eur(stats.inventory.value) : "—",
      sub: stats ? `${stats.inventory.count} prodotti` : "",
      href: `${base}/warehouse`,
    },
  ];

  return (
    <div className="flex-1 space-y-6 pb-20 md:pb-6">
      {/* ── Header + filters ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">Panoramica commerciale. Clicca un dato per il dettaglio.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:shrink-0">
          <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
            <SelectTrigger className="w-full sm:w-[170px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Questo mese</SelectItem>
              <SelectItem value="quarter">Questo trimestre</SelectItem>
              <SelectItem value="year">Quest&apos;anno</SelectItem>
              <SelectItem value="all">Sempre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="w-full sm:w-[160px] h-9"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli owner</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Low-stock alert banner ─────────────────────────────────────── */}
      {stats && stats.lowStock.count > 0 && (
        <Link
          href={`${base}/warehouse`}
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{stats.lowStock.count}</span>{" "}
            {stats.lowStock.count === 1 ? "prodotto è" : "prodotti sono"} sotto la soglia di scorta minima.
          </span>
          <ArrowUpRight className="h-4 w-4 ml-auto shrink-0" />
        </Link>
      )}

      {/* ── Widgets ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <Link key={w.label} href={w.href} className="group">
              <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-sm transition-all hover:bg-card/70 hover:border-primary/40 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{w.label}</CardTitle>
                  <w.icon className="h-4 w-4 text-primary shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold tracking-tight tabular-nums">{w.value}</div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{w.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground/70 px-1">
        Il filtro periodo si applica a “Vinti” e “Nuovi contatti”; il filtro owner a pipeline, vinti e contatti
        (le entità senza owner non sono filtrate).
      </p>
    </div>
  );
}
