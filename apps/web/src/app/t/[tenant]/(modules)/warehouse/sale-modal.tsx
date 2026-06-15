"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";

export const CHANNEL_LABEL: Record<string, string> = {
  ebay: "eBay", amazon: "Amazon", vinted: "Vinted", subito: "Subito", store: "Negozio", other: "Altro",
};
const CHANNELS = ["ebay", "amazon", "vinted", "subito", "store", "other"] as const;

/** Parse a user-typed number (comma or dot, possibly empty) to a number. */
const num = (s: string) => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function SaleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery(trpc.warehouse.product.list.queryOptions());

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("ebay");
  const [buyer, setBuyer] = useState("");

  const selected = products.find((p) => p.id === productId);
  const qtyNum = Math.max(1, Math.round(num(quantity)));
  const priceNum = num(unitPrice);

  function reset() {
    setProductId(""); setQuantity("1"); setUnitPrice(""); setChannel("ebay"); setBuyer("");
  }

  const record = useMutation(
    trpc.warehouse.sales.record.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.warehouse.sales.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.stockMovement.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.sales.report.queryOptions(undefined));
        toast.success("Vendita registrata. Stock aggiornato.");
        reset();
        onClose();
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const margin = selected ? (priceNum - selected.costPrice) * qtyNum : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Registra vendita</DialogTitle>
          <DialogDescription>Scala lo stock e calcola il margine. Il costo è quello attuale del prodotto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Prodotto</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                const p = products.find((x) => x.id === v);
                if (p) setUnitPrice(String(p.price));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Scegli un prodotto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.stockQuantity} pz
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Costo: € {selected.costPrice.toLocaleString("it-IT", { minimumFractionDigits: 2 })} · Disponibili: {selected.stockQuantity} pz
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-qty">Quantità</Label>
              <Input id="s-qty" inputMode="numeric" placeholder="1" value={quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-price">Prezzo unit. (€)</Label>
              <Input id="s-price" inputMode="decimal" placeholder="0,00" value={unitPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Canale</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as (typeof CHANNELS)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-buyer">Acquirente <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
            <Input id="s-buyer" value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Nome / username" />
          </div>

          {selected && (
            <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Margine stimato</span>
              <span className={margin >= 0 ? "font-medium text-green-600" : "font-medium text-destructive"}>
                € {margin.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Annulla</Button>
          <Button
            disabled={!productId || qtyNum < 1 || record.isPending}
            onClick={() => record.mutate({ productId, quantity: qtyNum, unitPrice: priceNum, channel, buyer: buyer.trim() || undefined })}
          >
            {record.isPending ? "Registrazione…" : "Registra vendita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
