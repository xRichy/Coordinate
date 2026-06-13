"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  return {
    headers: parseCSVLine(lines[0]),
    rows: lines.slice(1).map(parseCSVLine).filter((r) => r.some(Boolean)),
  };
}

/** Parse a possibly Italian-formatted number ("12,50" → 12.5). */
function parseNum(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

// ── Field definitions ─────────────────────────────────────────────────────────

const PRODUCT_FIELDS = [
  { key: "sku",               label: "SKU",            required: true  },
  { key: "name",              label: "Nome",           required: true  },
  { key: "category",          label: "Categoria",      required: true  },
  { key: "price",             label: "Prezzo",         required: true  },
  { key: "stockQuantity",     label: "Stock",          required: false },
  { key: "lowStockThreshold", label: "Soglia minima",  required: false },
] as const;

type FieldKey = typeof PRODUCT_FIELDS[number]["key"];
type Mapping = Record<FieldKey, string>;

const EMPTY_MAPPING: Mapping = {
  sku: "", name: "", category: "", price: "", stockQuantity: "", lowStockThreshold: "",
};

const BATCH_SIZE = 100;

// ── Component ─────────────────────────────────────────────────────────────────

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "upload" | "map" | "importing" | "done";

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ imported: 0, errors: 0 });

  const importBatch = useMutation(trpc.warehouse.product.importBatch.mutationOptions());

  function handleClose() {
    setStep("upload");
    setHeaders([]); setRows([]);
    setMapping(EMPTY_MAPPING);
    setProgress(0); setResult({ imported: 0, errors: 0 });
    onClose();
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { toast.error("File CSV vuoto o non valido."); return; }
      setHeaders(h);
      setRows(r);
      const autoMap: Mapping = { ...EMPTY_MAPPING };
      for (const field of PRODUCT_FIELDS) {
        const match = h.find(
          (col) => col.toLowerCase().replace(/[^a-z]/g, "").includes(field.key.toLowerCase())
        );
        if (match) autoMap[field.key] = match;
      }
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file, "utf-8");
  }

  function getCell(row: string[], col: string): string {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? "") : "";
  }

  function buildRow(row: string[]) {
    const sku = getCell(row, mapping.sku).trim();
    const name = getCell(row, mapping.name).trim();
    const category = getCell(row, mapping.category).trim();
    const price = parseNum(getCell(row, mapping.price));
    if (sku.length < 2 || name.length < 2 || category.length < 2 || !Number.isFinite(price) || price <= 0) {
      return null;
    }
    const stock = parseInt(getCell(row, mapping.stockQuantity), 10);
    const threshold = parseInt(getCell(row, mapping.lowStockThreshold), 10);
    return {
      sku, name, category, price,
      stockQuantity: Number.isFinite(stock) && stock >= 0 ? stock : undefined,
      lowStockThreshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : undefined,
    };
  }

  async function runImport() {
    setStep("importing");
    setProgress(0);
    let imported = 0;
    let errors = 0;

    const validRows = rows.map(buildRow).filter(Boolean) as NonNullable<ReturnType<typeof buildRow>>[];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      try {
        const res = await importBatch.mutateAsync(batch);
        imported += res.count;
      } catch {
        errors += batch.length;
      }
      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    await queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
    setResult({ imported, errors });
    setStep("done");
  }

  const preview = rows.slice(0, 5);
  const validCount = rows.map(buildRow).filter(Boolean).length;
  const canImport = !!mapping.sku && !!mapping.name && !!mapping.category && !!mapping.price && validCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Importa prodotti da CSV</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Carica un file CSV con i dati dei prodotti."}
            {step === "map" && `${rows.length} righe rilevate. Mappa le colonne ai campi Coordinate.`}
            {step === "importing" && "Importazione in corso…"}
            {step === "done" && "Importazione completata."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border/50 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Clicca o trascina un file CSV</p>
            <p className="text-sm text-muted-foreground mt-1">
              Colonne attese: SKU, Nome, Categoria, Prezzo, Stock, Soglia minima
            </p>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* ── Step 2: Mapping + preview ─────────────────────────────────── */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-sm w-32 shrink-0">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <Select
                    value={mapping[field.key]}
                    onValueChange={(val) => setMapping((m) => ({ ...m, [field.key]: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— non importare —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {preview.length > 0 && (
              <div className="rounded-lg border border-border/50 overflow-x-auto">
                <p className="text-xs text-muted-foreground px-3 py-2 border-b border-border/50">
                  Anteprima (prime {preview.length} righe con il mapping attuale)
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {PRODUCT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <TableHead key={f.key} className="text-xs">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        {PRODUCT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <TableCell key={f.key} className="text-xs max-w-[120px] truncate">
                            {getCell(row, mapping[f.key]) || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {validCount} di {rows.length} righe valide (servono SKU, Nome, Categoria e Prezzo &gt; 0).
              I duplicati per SKU già presente vengono saltati.
            </p>
          </div>
        )}

        {/* ── Step 3: Importing ─────────────────────────────────────────── */}
        {step === "importing" && (
          <div className="py-8 space-y-4">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">{progress}% completato</p>
          </div>
        )}

        {/* ── Step 4: Done ──────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="py-8 flex flex-col items-center gap-3">
            {result.errors === 0 ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-orange-500" />
            )}
            <p className="text-lg font-semibold">{result.imported} prodotti importati</p>
            {result.errors > 0 && (
              <p className="text-sm text-muted-foreground">
                {result.errors} righe non importate per errori.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Annulla</Button>
          )}
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Indietro</Button>
              <Button onClick={runImport} disabled={!canImport}>
                Importa {validCount} prodotti
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={handleClose}>Chiudi</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
