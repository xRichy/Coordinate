"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTRPC } from "@/lib/trpc";

type Lead = inferRouterOutputs<AppRouter>["crm"]["lead"]["list"][number];

const STAGES: Lead["status"][] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function LeadsBoardPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { data: leads = [] } = useQuery(trpc.crm.lead.list.queryOptions());
    const updateStatus = useMutation(
        trpc.crm.lead.updateStatus.mutationOptions({
            onSuccess: () => queryClient.invalidateQueries(trpc.crm.lead.list.queryOptions()),
        })
    );

    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

    const handleDragStart = (lead: Lead) => setDraggedLead(lead);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (status: Lead["status"]) => {
        if (draggedLead && draggedLead.status !== status) {
            updateStatus.mutate({ id: draggedLead.id, status });
        }
        setDraggedLead(null);
    };

    return (
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leads Board</h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        Il Kanban board è uno strumento visivo per gestire le tue opportunità di vendita (Leads).
                        Ogni colonna rappresenta una fase del processo di vendita. Puoi trascinare (drag & drop) i contatti da una fase all&apos;altra per aggiornarne lo stato fino alla chiusura (&quot;Won&quot; o &quot;Lost&quot;).
                    </p>
                </div>
                <Button className="shrink-0 group">
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                    Add Lead
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full items-start">
                    {STAGES.map((stage) => {
                        const stageLeads = leads.filter((l: Lead) => l.status === stage);
                        const totalValue = stageLeads.reduce((acc: number, lead: Lead) => acc + lead.value, 0);

                        return (
                            <div
                                key={stage}
                                className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 border border-border/40"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{stage}</h3>
                                    <Badge variant="secondary" className="bg-background">{stageLeads.length}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2 font-medium">
                                    ${totalValue.toLocaleString("en-US")}
                                </div>

                                <div className="flex flex-col gap-3 flex-1 min-h-[100px]">
                                    {stageLeads.map((lead: Lead) => (
                                        <Card
                                            key={lead.id}
                                            draggable
                                            onDragStart={() => handleDragStart(lead)}
                                            className="cursor-move bg-card/60 backdrop-blur-sm border-border/60 hover:border-primary/50 transition-colors shadow-sm"
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm leading-tight">{lead.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span className="font-medium text-foreground">${lead.value.toLocaleString("en-US")}</span>
                                                    <span>{lead.customerName}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
