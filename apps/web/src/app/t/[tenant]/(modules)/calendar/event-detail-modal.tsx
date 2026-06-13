"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Trash2, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Activity = inferRouterOutputs<AppRouter>["activities"]["activity"]["list"][number];
type ActivityStatus = Activity["status"];

const TYPE_LABELS: Record<string, string> = {
  task: "Task", call: "Chiamata", meeting: "Riunione", note: "Nota",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Bassa", medium: "Media", high: "Alta",
};
const PRIORITY_CLASSES: Record<string, string> = {
  low: "text-green-600 border-green-600/20 bg-green-600/10",
  medium: "text-orange-500 border-orange-500/20 bg-orange-500/10",
  high: "text-destructive border-destructive/20 bg-destructive/10",
};

interface EventDetailModalProps {
  activity: Activity | null;
  onClose: () => void;
}

export function EventDetailModal({ activity, onClose }: EventDetailModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions());

  const updateStatus = useMutation(
    trpc.activities.activity.updateStatus.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Errore durante l'aggiornamento."),
    })
  );

  const deleteActivity = useMutation(
    trpc.activities.activity.delete.mutationOptions({
      onSuccess: () => { invalidate(); onClose(); toast.success("Attività eliminata."); },
      onError: () => toast.error("Errore durante l'eliminazione."),
    })
  );

  if (!activity) return null;

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="pr-6">{activity.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TYPE_LABELS[activity.type] ?? activity.type}</Badge>
            <Badge variant="outline" className={PRIORITY_CLASSES[activity.priority]}>
              {PRIORITY_LABELS[activity.priority] ?? activity.priority}
            </Badge>
          </div>

          {activity.dueDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {format(new Date(activity.dueDate), "EEEE d MMMM yyyy", { locale: it })}
            </div>
          )}

          {activity.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <StickyNote className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground whitespace-pre-wrap">{activity.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stato</span>
              <Select
                value={activity.status}
                onValueChange={(value: ActivityStatus) =>
                  updateStatus.mutate({ id: activity.id, status: value })
                }
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Da fare</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="done">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => deleteActivity.mutate({ id: activity.id })}
              disabled={deleteActivity.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Elimina
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
