"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import {
  StickyNote, Phone, Users, CheckSquare,
  ArrowRight, Trophy, Flag, Plus, Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";

interface EntityTimelineProps {
  contactId?: string;
  dealId?: string;
}

const DEAL_STATUS_IT: Record<string, string> = {
  open: "Aperto",
  won: "Vinto",
  lost: "Perso",
};

function localize(value: string | null): string {
  if (!value) return "";
  return DEAL_STATUS_IT[value] ?? value;
}

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  note: StickyNote,
  call: Phone,
  meeting: Users,
  task: CheckSquare,
};

const ACTIVITY_LABEL: Record<string, string> = {
  note: "Nota",
  call: "Chiamata",
  meeting: "Riunione",
  task: "Task",
};

export function EntityTimeline({ contactId, dealId }: EntityTimelineProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const queryOptions = contactId
    ? trpc.crm.timeline.byContact.queryOptions({ contactId })
    : trpc.crm.timeline.byDeal.queryOptions({ dealId: dealId! });

  const { data: items = [], isLoading } = useQuery(queryOptions);

  const addNote = useMutation(
    trpc.activities.activity.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(queryOptions);
        queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions());
        setNote("");
        toast.success("Nota aggiunta.");
      },
      onError: () => toast.error("Errore durante l'aggiunta della nota."),
    })
  );

  function submitNote() {
    const title = note.trim();
    if (title.length < 2) return;
    addNote.mutate({ title, type: "note", contactId, dealId });
  }

  return (
    <div className="space-y-3">
      {/* Quick add note */}
      <div className="flex items-center gap-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); submitNote(); }
          }}
          placeholder="Aggiungi una nota…"
          className="h-9 text-sm"
          disabled={addNote.isPending}
        />
        <Button
          size="sm"
          className="h-9 shrink-0 gap-1"
          onClick={submitNote}
          disabled={addNote.isPending || note.trim().length < 2}
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Clock className="h-7 w-7 opacity-30" />
          <p className="text-sm">Nessuna attività ancora.</p>
        </div>
      ) : (
        <ol className="relative space-y-1 pl-1">
          {items.map((item) => {
            const at = new Date(item.at);
            const Icon =
              item.kind === "activity"
                ? ACTIVITY_ICON[item.activityType] ?? CheckSquare
                : item.eventType === "deal_created"
                  ? Trophy
                  : item.eventType === "deal_status_changed"
                    ? Flag
                    : ArrowRight;

            return (
              <li key={`${item.kind}-${item.id}`} className="flex gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  {item.kind === "activity" ? (
                    <>
                      <p className="text-sm leading-snug">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1.5">
                          {ACTIVITY_LABEL[item.activityType] ?? item.activityType}
                        </span>
                        {item.title}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm leading-snug">
                      {item.eventType === "deal_created" ? (
                        <>Deal creato: <span className="font-medium">{item.title}</span></>
                      ) : item.eventType === "deal_status_changed" ? (
                        <>
                          Stato deal: {localize(item.fromValue)}{" "}
                          <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted-foreground" />{" "}
                          <span className="font-medium">{localize(item.toValue)}</span>
                        </>
                      ) : (
                        <>
                          Stadio: {localize(item.fromValue)}{" "}
                          <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted-foreground" />{" "}
                          <span className="font-medium">{localize(item.toValue)}</span>
                        </>
                      )}
                    </p>
                  )}
                  <p
                    className="text-[11px] text-muted-foreground/70 mt-0.5"
                    title={format(at, "d MMMM yyyy, HH:mm", { locale: it })}
                  >
                    {formatDistanceToNow(at, { addSuffix: true, locale: it })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
