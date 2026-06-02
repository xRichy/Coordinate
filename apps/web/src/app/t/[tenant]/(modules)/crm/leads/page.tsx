"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { LeadModal } from "./lead-modal";
import { StagesModal } from "./stages-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Lead = inferRouterOutputs<AppRouter>["crm"]["lead"]["list"][number];
type Stage = inferRouterOutputs<AppRouter>["crm"]["stage"]["list"][number];

export default function LeadsBoardPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading: leadsLoading } = useQuery(trpc.crm.lead.list.queryOptions());
  const { data: stages = [], isLoading: stagesLoading } = useQuery(trpc.crm.stage.list.queryOptions());

  const updateStage = useMutation(
    trpc.crm.lead.updateStage.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.crm.lead.list.queryOptions()),
      onError: () => toast.error("Errore durante l'aggiornamento."),
    })
  );

  const deleteLead = useMutation(
    trpc.crm.lead.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.crm.lead.list.queryOptions());
        toast.success("Lead eliminato.");
      },
      onError: () => toast.error("Errore durante l'eliminazione."),
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

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Gestisci le opportunità di vendita. Trascina le card per cambiare stadio.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setStagesOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Stadi
          </Button>
          <Button className="group" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Nuovo lead
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
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
                            <div className="flex items-center gap-1">
                              {lead.contactName && (
                                <span className="truncate max-w-[70px]">{lead.contactName}</span>
                              )}
                              <button
                                onClick={() => deleteLead.mutate({ id: lead.id })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                                aria-label="Elimina lead"
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

            {/* Leads without a stage */}
            {leads.some((l) => !l.stageId) && (
              <div
                className="w-56 flex flex-col gap-3 rounded-xl bg-muted/20 p-4 border border-dashed border-border/40 min-h-[200px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-muted-foreground">Non assegnati</h3>
                  <Badge variant="outline" className="text-xs">
                    {leads.filter((l) => !l.stageId).length}
                  </Badge>
                </div>
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

      <LeadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} stages={sorted} />
      <StagesModal isOpen={stagesOpen} onClose={() => setStagesOpen(false)} />
    </div>
  );
}
