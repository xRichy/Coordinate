"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Settings2, ArrowRight, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { LeadModal } from "./lead-modal";
import { StagesModal } from "./stages-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Lead = inferRouterOutputs<AppRouter>["crm"]["lead"]["list"][number];
type Stage = inferRouterOutputs<AppRouter>["crm"]["stage"]["list"][number];
type Deal = inferRouterOutputs<AppRouter>["crm"]["deal"]["list"][number];

const DEAL_STATUS_LABELS: Record<Deal["status"], string> = {
  open: "Aperto",
  won: "Vinto",
  lost: "Perso",
};

export default function LeadsBoardPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading: leadsLoading } = useQuery(trpc.crm.lead.list.queryOptions());
  const { data: stages = [], isLoading: stagesLoading } = useQuery(trpc.crm.stage.list.queryOptions());
  const { data: deals = [] } = useQuery(trpc.crm.deal.list.queryOptions());

  const invalidateLeads = () => queryClient.invalidateQueries(trpc.crm.lead.list.queryOptions());
  const invalidateDeals = () => queryClient.invalidateQueries(trpc.crm.deal.list.queryOptions());

  const updateStage = useMutation(
    trpc.crm.lead.updateStage.mutationOptions({
      onSuccess: invalidateLeads,
      onError: () => toast.error("Errore durante l'aggiornamento."),
    })
  );

  const deleteLead = useMutation(
    trpc.crm.lead.delete.mutationOptions({
      onSuccess: () => { invalidateLeads(); toast.success("Lead eliminato."); },
      onError: () => toast.error("Errore durante l'eliminazione."),
    })
  );

  const convertToDeal = useMutation(
    trpc.crm.lead.convertToDeal.mutationOptions({
      onSuccess: () => {
        invalidateDeals();
        toast.success("Lead convertito in Deal.");
      },
      onError: () => toast.error("Errore durante la conversione."),
    })
  );

  const updateDealStatus = useMutation(
    trpc.crm.deal.updateStatus.mutationOptions({
      onSuccess: (deal) => {
        invalidateDeals();
        queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
        if (deal.status === "won") toast.success("Deal vinto! Il contatto è stato marcato come Cliente.");
        else if (deal.status === "lost") toast("Deal segnato come perso.");
        else toast("Deal riaperto.");
      },
      onError: () => toast.error("Errore."),
    })
  );

  const deleteDeal = useMutation(
    trpc.crm.deal.delete.mutationOptions({
      onSuccess: () => { invalidateDeals(); toast.success("Deal eliminato."); },
      onError: () => toast.error("Errore."),
    })
  );

  function handleDragStart(lead: Lead) { setDraggedLead(lead); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(stageId: string | null) {
    if (draggedLead && draggedLead.stageId !== stageId) {
      updateStage.mutate({ id: draggedLead.id, stageId });
    }
    setDraggedLead(null);
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const isLoading = leadsLoading || stagesLoading;

  const openDeals = deals.filter((d) => d.status === "open");
  const closedDeals = deals.filter((d) => d.status !== "open");

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
          <p className="text-muted-foreground mt-2">
            Gestisci lead e deal. Trascina per cambiare stadio.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setStagesOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />Stadi
          </Button>
          <Button className="group" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Nuovo lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="leads" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-fit">
          <TabsTrigger value="leads">
            Lead
            {leads.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{leads.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deal
            {openDeals.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{openDeals.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Kanban ─────────────────────────────────────────────────────── */}
        <TabsContent value="leads" className="flex-1 overflow-hidden mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max items-start">
                {sorted.map((stage: Stage) => {
                  const stageLeads = leads.filter((l) => l.stageId === stage.id);
                  const totalValue = stageLeads.reduce((acc, l) => acc + (l.value ?? 0), 0);
                  return (
                    <div
                      key={stage.id}
                      className="w-56 flex flex-col gap-3 rounded-xl bg-muted/40 p-4 border border-border/40 min-h-[200px]"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(stage.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{stage.name}</h3>
                        <Badge variant="secondary" className="bg-background text-xs shrink-0 ml-1">
                          {stageLeads.length}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">
                        {totalValue > 0 ? `€ ${totalValue.toLocaleString("it-IT")}` : "—"}
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        {stageLeads.map((lead) => (
                          <Card
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead)}
                            className="cursor-move bg-card/60 backdrop-blur-sm border-border/60 hover:border-primary/50 transition-colors shadow-sm group"
                          >
                            <CardHeader className="p-3 pb-1">
                              <CardTitle className="text-xs leading-tight">{lead.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {lead.value ? `€ ${lead.value.toLocaleString("it-IT")}` : "—"}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    title="Converti in Deal"
                                    onClick={() => convertToDeal.mutate({ id: lead.id })}
                                    disabled={convertToDeal.isPending}
                                    className="p-0.5 hover:text-primary"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                  <button
                                    title="Elimina lead"
                                    onClick={() => deleteLead.mutate({ id: lead.id })}
                                    disabled={deleteLead.isPending}
                                    className="p-0.5 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {leads.some((l) => !l.stageId) && (
                  <div
                    className="w-56 flex flex-col gap-3 rounded-xl bg-muted/20 p-4 border border-dashed border-border/40 min-h-[200px]"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(null)}
                  >
                    <h3 className="font-semibold text-sm text-muted-foreground">Non assegnati</h3>
                    <div className="flex flex-col gap-2 flex-1">
                      {leads.filter((l) => !l.stageId).map((lead) => (
                        <Card key={lead.id} draggable onDragStart={() => handleDragStart(lead)}
                          className="cursor-move bg-card/40 border-border/40 shadow-sm group opacity-70">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs leading-tight">{lead.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{lead.value ? `€ ${lead.value.toLocaleString("it-IT")}` : "—"}</span>
                              <button onClick={() => deleteLead.mutate({ id: lead.id })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Deals ──────────────────────────────────────────────────────── */}
        <TabsContent value="deals" className="mt-4">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 bg-card/40 rounded-xl border border-border/50">
              <Trophy className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nessun deal ancora. Converti un lead con →</p>
            </div>
          ) : (
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Contatto</TableHead>
                    <TableHead>Valore</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Chiusura</TableHead>
                    <TableHead className="w-[160px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}
                      className={deal.status !== "open" ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {deal.contact?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {deal.value ? `€ ${deal.value.toLocaleString("it-IT")}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          deal.status === "won" ? "default" :
                          deal.status === "lost" ? "destructive" : "secondary"
                        }>
                          {DEAL_STATUS_LABELS[deal.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {deal.closedAt
                          ? new Date(deal.closedAt).toLocaleDateString("it-IT")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {deal.status !== "won" && (
                            <Button variant="outline" size="sm" className="text-xs h-7"
                              onClick={() => updateDealStatus.mutate({ id: deal.id, status: "won" })}
                              disabled={updateDealStatus.isPending}>
                              <Trophy className="h-3 w-3 mr-1" />Vinto
                            </Button>
                          )}
                          {deal.status !== "lost" && deal.status !== "won" && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive"
                              onClick={() => updateDealStatus.mutate({ id: deal.id, status: "lost" })}
                              disabled={updateDealStatus.isPending}>
                              <X className="h-3 w-3 mr-1" />Perso
                            </Button>
                          )}
                          {deal.status !== "open" && (
                            <Button variant="ghost" size="sm" className="text-xs h-7"
                              onClick={() => updateDealStatus.mutate({ id: deal.id, status: "open" })}
                              disabled={updateDealStatus.isPending}>
                              Riapri
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("Eliminare?")) deleteDeal.mutate({ id: deal.id }); }}
                            disabled={deleteDeal.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {closedDeals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              {closedDeals.length} deal chiusi (vinti o persi) · valore vinto:{" "}
              €{deals.filter((d) => d.status === "won")
                .reduce((a, d) => a + (d.value ?? 0), 0)
                .toLocaleString("it-IT")}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <LeadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} stages={sorted} />
      <StagesModal isOpen={stagesOpen} onClose={() => setStagesOpen(false)} />
    </div>
  );
}
