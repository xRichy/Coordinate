"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Target, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type SearchResult = inferRouterOutputs<AppRouter>["search"]["global"][number];
type ResultType = SearchResult["type"];

const TYPE_META: Record<ResultType, { label: string; icon: React.ElementType; path: string }> = {
  contact: { label: "Contatti", icon: Users, path: "/crm/customers" },
  deal: { label: "Deal", icon: Target, path: "/crm/leads" },
  product: { label: "Prodotti", icon: Package, path: "/warehouse" },
};
const TYPE_ORDER: ResultType[] = ["contact", "deal", "product"];

export function GlobalSearch() {
  const trpc = useTRPC();
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const base = `/t/${tenant}`;

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the query (250ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    ...trpc.search.global.queryOptions({ query: debounced }),
    enabled: debounced.length >= 2,
  });

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(result: SearchResult) {
    router.push(`${base}${TYPE_META[result.type].path}`);
    setOpen(false);
    setQuery("");
  }

  const showDropdown = open && debounced.length >= 2;
  const grouped = TYPE_ORDER
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative ml-auto flex-1 sm:flex-initial">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 md:left-2.5 md:top-3 h-5 w-5 md:h-4 md:w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cerca contatti, deal, prodotti…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          className="w-full h-12 md:h-10 rounded-lg bg-background pl-10 md:pl-8 sm:w-[300px] md:w-[240px] lg:w-[340px]"
        />
        {isFetching && debounced.length >= 2 && (
          <Loader2 className="absolute right-3 top-3.5 md:top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-full sm:w-[360px] rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden z-50">
          {grouped.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              {isFetching ? "Ricerca…" : `Nessun risultato per “${debounced}”.`}
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {grouped.map((group) => {
                const Icon = TYPE_META[group.type].icon;
                return (
                  <li key={group.type}>
                    <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {TYPE_META[group.type].label}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                        )}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
