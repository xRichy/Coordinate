"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, isToday,
  format,
} from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/lib/trpc";
import { EventDetailModal } from "./event-detail-modal";
import { EventCreateModal } from "./event-create-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Activity = inferRouterOutputs<AppRouter>["activities"]["activity"]["list"][number];
type CalendarView = "month" | "week";

const WEEK_STARTS_ON = 1; // lunedì
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Tailwind classes per event type chip
const TYPE_CHIP: Record<string, string> = {
  meeting: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  call: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  task: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  note: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function EventChip({ activity, onSelect }: { activity: Activity; onSelect: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      title={activity.title}
      className={cn(
        "w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors hover:brightness-125",
        TYPE_CHIP[activity.type] ?? TYPE_CHIP.task,
        activity.status === "done" && "line-through opacity-60"
      )}
    >
      {activity.title}
    </button>
  );
}

export default function CalendarPage() {
  const trpc = useTRPC();
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Activity | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const { data: activities = [], isLoading } = useQuery(
    trpc.activities.activity.list.queryOptions()
  );

  // events = activities with a dueDate
  const events = useMemo(
    () => activities.filter((a): a is Activity & { dueDate: string | Date } => a.dueDate != null),
    [activities]
  );

  function eventsOn(day: Date): Activity[] {
    return events
      .filter((a) => isSameDay(new Date(a.dueDate as string), day))
      .sort((x, y) => +new Date(x.dueDate as string) - +new Date(y.dueDate as string));
  }

  const goPrev = () => setCursor((c) => (view === "month" ? subMonths(c, 1) : subWeeks(c, 1)));
  const goNext = () => setCursor((c) => (view === "month" ? addMonths(c, 1) : addWeeks(c, 1)));
  const goToday = () => setCursor(new Date());

  const weekStart = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });

  const periodLabel =
    view === "month"
      ? format(cursor, "LLLL yyyy", { locale: it })
      : `${format(weekStart, "d", { locale: it })}–${format(weekEnd, "d MMM yyyy", { locale: it })}`;

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendario</h2>
          <p className="text-muted-foreground mt-2">Attività con scadenza, in vista mese o settimana.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={goPrev} title="Precedente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={goToday}>Oggi</Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={goNext} title="Successivo">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-0.5 border border-border/50 rounded-lg p-0.5 bg-muted/30">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm" className="h-8 w-8 p-0" title="Vista mese"
              onClick={() => setView("month")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm" className="h-8 w-8 p-0" title="Vista settimana"
              onClick={() => setView("week")}
            >
              <Columns3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Period label ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-1">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-xl font-semibold capitalize">{periodLabel}</h3>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton className="h-[480px] rounded-xl" />
      ) : view === "month" ? (
        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border/50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dayEvents = eventsOn(day);
              const inMonth = isSameMonth(day, cursor);
              const visible = dayEvents.slice(0, 3);
              const overflow = dayEvents.length - visible.length;
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setCreateDate(day)}
                  title="Aggiungi attività"
                  className={cn(
                    "min-h-[104px] border-b border-r border-border/40 p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-muted/30 transition-colors",
                    !inMonth && "bg-muted/20 text-muted-foreground/50"
                  )}
                >
                  <div className="flex justify-end">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) && "bg-primary text-primary-foreground",
                      !isToday(day) && !inMonth && "opacity-50"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {visible.map((a) => (
                      <EventChip key={a.id} activity={a} onSelect={() => setSelected(a)} />
                    ))}
                    {overflow > 0 && (
                      <span className="px-1 text-[10px] text-muted-foreground">+{overflow} altri</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = eventsOn(day);
            return (
              <div
                key={day.toISOString()}
                onClick={() => setCreateDate(day)}
                title="Aggiungi attività"
                className={cn(
                  "bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3 min-h-[220px] flex flex-col gap-2 cursor-pointer hover:border-border transition-colors",
                  isToday(day) && "border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                    {format(day, "EEE", { locale: it })}
                  </span>
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {dayEvents.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground/50 mt-1">—</span>
                  ) : (
                    dayEvents.map((a) => (
                      <EventChip key={a.id} activity={a} onSelect={() => setSelected(a)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EventDetailModal activity={selected} onClose={() => setSelected(null)} />
      <EventCreateModal date={createDate} onClose={() => setCreateDate(null)} />
    </div>
  );
}
