"use client";

import {
  Dialog, DialogContent, DialogHeader,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trophy, X, Trash2, User, Euro, CalendarCheck, Clock } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import { EntityTimeline } from "@/components/timeline/entity-timeline";

type Deal = inferRouterOutputs<AppRouter>["crm"]["deal"]["list"][number];
type DealStatus = Deal["status"];

const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  open: "Aperto",
  won: "Vinto",
  lost: "Perso",
};

const DEAL_STATUS_VARIANT: Record<DealStatus, "default" | "destructive" | "secondary"> = {
  open: "secondary",
  won: "default",
  lost: "destructive",
};

interface DealDetailModalProps {
  deal: Deal | null;
  onClose: () => void;
  onUpdateStatus: (status: DealStatus) => void;
  onDelete: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function DealDetailModal({
  deal,
  onClose,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting,
}: DealDetailModalProps) {
  if (!deal) return null;

  return (
    <Dialog open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="sr-only">
          <span>{deal.title}</span>
        </DialogHeader>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="px-7 pt-7 pb-6 bg-gradient-to-b from-muted/40 to-transparent">
          <h2 className="text-lg font-semibold leading-tight truncate">{deal.title}</h2>
          <div className="mt-2">
            <Badge variant={DEAL_STATUS_VARIANT[deal.status]}>
              {DEAL_STATUS_LABELS[deal.status]}
            </Badge>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="px-7 pb-2 space-y-4">
          <Separator className="opacity-50" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow
              icon={User}
              label="Contatto"
              value={deal.contact?.name ?? "—"}
            />
            <InfoRow
              icon={Euro}
              label="Valore"
              value={deal.value ? `€ ${deal.value.toLocaleString("it-IT")}` : "—"}
            />
            {deal.closedAt && (
              <InfoRow
                icon={CalendarCheck}
                label="Chiusura"
                value={new Date(deal.closedAt).toLocaleDateString("it-IT")}
              />
            )}
          </div>

          {/* ── Status actions ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {deal.status !== "won" && (
              <Button variant="outline" size="sm" className="text-xs h-8"
                onClick={() => onUpdateStatus("won")} disabled={isUpdating}>
                <Trophy className="h-3.5 w-3.5 mr-1" />Segna vinto
              </Button>
            )}
            {deal.status !== "lost" && deal.status !== "won" && (
              <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive"
                onClick={() => onUpdateStatus("lost")} disabled={isUpdating}>
                <X className="h-3.5 w-3.5 mr-1" />Segna perso
              </Button>
            )}
            {deal.status !== "open" && (
              <Button variant="ghost" size="sm" className="text-xs h-8"
                onClick={() => onUpdateStatus("open")} disabled={isUpdating}>
                Riapri
              </Button>
            )}
          </div>

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <Separator className="opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-wider">Timeline</p>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1">
              <EntityTimeline dealId={deal.id} />
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end px-7 py-5 mt-2 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            Elimina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
