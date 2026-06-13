"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Stage = inferRouterOutputs<AppRouter>["crm"]["stage"]["list"][number];

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StagesModal({ isOpen, onClose }: StagesModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const { data: stages = [] } = useQuery(trpc.crm.stage.list.queryOptions());

  const invalidate = () => queryClient.invalidateQueries(trpc.crm.stage.list.queryOptions());

  const updateStage = useMutation(trpc.crm.stage.update.mutationOptions({
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: () => toast.error("Errore durante l'aggiornamento."),
  }));

  const createStage = useMutation(trpc.crm.stage.create.mutationOptions({
    onSuccess: () => { invalidate(); setNewName(""); setAddingNew(false); },
    onError: () => toast.error("Errore durante la creazione."),
  }));

  const deleteStage = useMutation(trpc.crm.stage.delete.mutationOptions({
    onSuccess: () => { invalidate(); toast.success("Stadio eliminato. I lead associati sono stati scollegati."); },
    onError: () => toast.error("Errore durante l'eliminazione."),
  }));

  const reorder = useMutation(trpc.crm.stage.reorder.mutationOptions({
    onSuccess: invalidate,
    onError: () => toast.error("Errore durante il riordino."),
  }));

  function moveStage(stage: Stage, direction: "up" | "down") {
    const sorted = [...stages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === stage.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newOrder = sorted.map((s, i) => {
      if (i === idx) return { id: s.id, order: sorted[swapIdx].order };
      if (i === swapIdx) return { id: s.id, order: sorted[idx].order };
      return { id: s.id, order: s.order };
    });
    reorder.mutate(newOrder);
  }

  function startEdit(stage: Stage) {
    setEditingId(stage.id);
    setEditName(stage.name);
  }

  function confirmEdit() {
    if (!editingId || !editName.trim()) return;
    updateStage.mutate({ id: editingId, name: editName.trim() });
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Configura stadi pipeline</DialogTitle>
          <DialogDescription>
            Rinomina, riordina o aggiungi stadi. I lead vengono scollegati se uno stadio viene eliminato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[360px] overflow-y-auto py-1">
          {sorted.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/40 group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

              {editingId === stage.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingId(null); }}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm font-medium">{stage.name}</span>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {editingId === stage.id ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={confirmEdit}
                      disabled={updateStage.isPending}>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => moveStage(stage, "up")} disabled={idx === 0 || reorder.isPending}>
                      ↑
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => moveStage(stage, "down")}
                      disabled={idx === sorted.length - 1 || reorder.isPending}>
                      ↓
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => startEdit(stage)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Eliminare lo stadio "${stage.name}"? I lead verranno scollegati.`))
                          deleteStage.mutate({ id: stage.id });
                      }}
                      disabled={deleteStage.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add new stage */}
          {addingNew ? (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-primary/50">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) createStage.mutate({ name: newName.trim() });
                  if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
                }}
                placeholder="Nome stadio…"
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => newName.trim() && createStage.mutate({ name: newName.trim() })}
                disabled={createStage.isPending}>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => { setAddingNew(false); setNewName(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => setAddingNew(true)}>
              <Plus className="mr-2 h-4 w-4" />Aggiungi stadio
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
