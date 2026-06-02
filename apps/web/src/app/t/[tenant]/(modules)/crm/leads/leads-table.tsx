"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowRight, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Lead = inferRouterOutputs<AppRouter>["crm"]["lead"]["list"][number];
type Stage = inferRouterOutputs<AppRouter>["crm"]["stage"]["list"][number];

type SortKey = "title" | "stageName" | "value" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function SortIcon({ field, active, dir }: { field: SortKey; active: SortKey; dir: SortDir }) {
  if (field !== active) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-30 ml-1 shrink-0" />;
  return dir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 ml-1 shrink-0" />
    : <ChevronDown className="h-3.5 w-3.5 ml-1 shrink-0" />;
}

interface LeadsTableProps {
  leads: Lead[];
  stages: Stage[];
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
  isConverting: boolean;
  isDeleting: boolean;
}

export function LeadsTable({ leads, stages, onConvert, onDelete, isConverting, isDeleting }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleStageFilter(v: string) {
    setStageFilter(v);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = [...leads];
    if (search) result = result.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));
    if (stageFilter !== "all") result = result.filter((l) => l.stageId === stageFilter);

    result.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortKey) {
        case "title":
          av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
        case "stageName":
          av = a.stage?.name.toLowerCase() ?? ""; bv = b.stage?.name.toLowerCase() ?? ""; break;
        case "value":
          av = a.value ?? 0; bv = b.value ?? 0; break;
        case "createdAt":
          av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); break;
        default:
          return 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, stageFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || stageFilter !== "all";

  return (
    <div className="space-y-3">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Cerca lead…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 w-[200px] text-sm bg-card/40 border-border/50"
        />
        <Select value={stageFilter} onValueChange={handleStageFilter}>
          <SelectTrigger className="h-8 w-[160px] text-sm bg-card/40 border-border/50">
            <SelectValue placeholder="Tutti gli stadi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stadi</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { handleSearch(""); handleStageFilter("all"); }}
          >
            Azzera filtri
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} lead
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center text-xs font-medium uppercase tracking-wide"
                  onClick={() => handleSort("title")}
                >
                  Titolo <SortIcon field="title" active={sortKey} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Contatto</TableHead>
              <TableHead>
                <button
                  className="flex items-center text-xs font-medium uppercase tracking-wide"
                  onClick={() => handleSort("stageName")}
                >
                  Stadio <SortIcon field="stageName" active={sortKey} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center text-xs font-medium uppercase tracking-wide"
                  onClick={() => handleSort("value")}
                >
                  Valore <SortIcon field="value" active={sortKey} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center text-xs font-medium uppercase tracking-wide"
                  onClick={() => handleSort("createdAt")}
                >
                  Creato <SortIcon field="createdAt" active={sortKey} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  {hasFilters ? "Nessun lead corrisponde ai filtri." : "Nessun lead ancora."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.contactName ?? "—"}
                  </TableCell>
                  <TableCell>
                    {lead.stage ? (
                      <Badge variant="outline" className="text-xs">{lead.stage.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {lead.value ? `€ ${lead.value.toLocaleString("it-IT")}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Converti in Deal"
                        onClick={() => onConvert(lead.id)}
                        disabled={isConverting}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Elimina lead"
                        onClick={() => onDelete(lead.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            Pagina {page} di {totalPages} · {filtered.length} lead
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              ← Precedente
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Successiva →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
