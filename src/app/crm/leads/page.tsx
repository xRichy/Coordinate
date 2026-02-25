"use client";

import { useState } from "react";
import { useAppStore, Lead } from "@/store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const STAGES: Lead["status"][] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function LeadsBoardPage() {
    const { leads, updateLeadStatus } = useAppStore();

    // Drag and Drop mock state
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

    const handleDragStart = (lead: Lead) => setDraggedLead(lead);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (status: Lead["status"]) => {
        if (draggedLead && draggedLead.status !== status) {
            updateLeadStatus(draggedLead.id, status);
        }
        setDraggedLead(null);
    };

    return (
        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leads Board</h2>
                    <p className="text-muted-foreground">Drag and drop leads across pipeline stages.</p>
                </div>
                <Button className="shrink-0 group">
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                    Add Lead
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 h-full min-h-[600px] items-start">
                    {STAGES.map((stage) => {
                        const stageLeads = leads.filter((l) => l.status === stage);
                        const totalValue = stageLeads.reduce((acc, lead) => acc + lead.value, 0);

                        return (
                            <div
                                key={stage}
                                className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-xl bg-muted/40 p-4 border border-border/40"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{stage}</h3>
                                    <Badge variant="secondary" className="bg-background">{stageLeads.length}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2 font-medium">
                                    ${totalValue.toLocaleString()}
                                </div>

                                <div className="flex flex-col gap-3 flex-1 min-h-[100px]">
                                    {stageLeads.map((lead) => (
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
                                                    <span className="font-medium text-foreground">${lead.value.toLocaleString()}</span>
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
