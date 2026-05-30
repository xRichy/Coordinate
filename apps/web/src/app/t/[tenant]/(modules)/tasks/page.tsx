"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, CheckCircle2, Clock, Circle, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { ActivityModal } from "./activity-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Activity = inferRouterOutputs<AppRouter>["activities"]["activity"]["list"][number];
type ActivityStatus = Activity["status"];
type ActivityPriority = Activity["priority"];

const PRIORITY_LABELS: Record<ActivityPriority, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
};

const PRIORITY_CLASSES: Record<ActivityPriority, string> = {
  low: "text-green-600 border-green-600/20 bg-green-600/10",
  medium: "text-orange-500 border-orange-500/20 bg-orange-500/10",
  high: "text-destructive border-destructive/20 bg-destructive/10",
};

const STATUS_LABELS: Record<ActivityStatus, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  done: "Completato",
};

function StatusIcon({ status }: { status: ActivityStatus }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-orange-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

export default function TasksPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities = [], isLoading } = useQuery(
    trpc.activities.activity.list.queryOptions()
  );

  const updateStatus = useMutation(
    trpc.activities.activity.updateStatus.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions()),
      onError: () => toast.error("Errore durante l'aggiornamento."),
    })
  );

  const deleteActivity = useMutation(
    trpc.activities.activity.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions());
        toast.success("Attività eliminata.");
      },
      onError: () => toast.error("Errore durante l'eliminazione."),
    })
  );

  const filtered = activities.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attività</h2>
          <p className="text-muted-foreground">
            Task, chiamate, riunioni e note del tuo team.
          </p>
        </div>
        <Button className="shrink-0 group" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Nuova attività
        </Button>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex items-center gap-4 border-b border-border/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca attività…"
              className="pl-8 bg-background/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <ListTodo className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              {searchTerm ? "Nessun risultato." : "Nessuna attività ancora."}
            </p>
            {!searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crea la prima
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[400px]">Attività</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Priorità</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((activity) => (
                <TableRow
                  key={activity.id}
                  className="border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={activity.status} />
                      <span
                        className={
                          activity.status === "done"
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {activity.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={activity.status}
                      onValueChange={(value: ActivityStatus) =>
                        updateStatus.mutate({ id: activity.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Da fare</SelectItem>
                        <SelectItem value="in_progress">In corso</SelectItem>
                        <SelectItem value="done">Completato</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PRIORITY_CLASSES[activity.priority]}
                    >
                      {PRIORITY_LABELS[activity.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {activity.dueDate
                      ? format(new Date(activity.dueDate), "d MMM yyyy", { locale: it })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 hover:text-destructive"
                      onClick={() => deleteActivity.mutate({ id: activity.id })}
                      disabled={deleteActivity.isPending}
                    >
                      Elimina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ActivityModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
