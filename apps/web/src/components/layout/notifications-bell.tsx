"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trophy, Clock, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Notification = inferRouterOutputs<AppRouter>["notifications"]["list"][number];

const TYPE_ICON: Record<string, React.ElementType> = {
  deal_won: Trophy,
  activity_reminder: Clock,
};

export function NotificationsBell() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const listOptions = trpc.notifications.list.queryOptions();
  const countOptions = trpc.notifications.unreadCount.queryOptions();

  const { data: notifications = [] } = useQuery(listOptions);
  const { data: unreadCount = 0 } = useQuery({
    ...countOptions,
    refetchInterval: 60_000, // keep the badge fresh
  });

  function invalidate() {
    queryClient.invalidateQueries(listOptions);
    queryClient.invalidateQueries(countOptions);
  }

  const markAsRead = useMutation(
    trpc.notifications.markAsRead.mutationOptions({ onSuccess: invalidate })
  );
  const markAllAsRead = useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({ onSuccess: invalidate })
  );

  function onItemClick(n: Notification) {
    if (!n.readAt) markAsRead.mutate({ id: n.id });
    if (n.link) router.push(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-accent hover:text-accent-foreground h-9 w-9 md:h-10 md:w-10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifiche</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <span className="text-sm font-semibold">Notifiche</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Segna tutte lette
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-7 w-7 opacity-30" />
            <p className="text-sm">Nessuna notifica.</p>
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => onItemClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors",
                      !n.readAt && "bg-primary/5"
                    )}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm leading-snug", !n.readAt && "font-medium")}>{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
                      </p>
                    </div>
                    {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
