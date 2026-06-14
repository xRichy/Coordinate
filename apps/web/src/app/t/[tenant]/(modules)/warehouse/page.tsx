"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ArrowRightLeft, Edit2, ArrowDownToLine, ArrowUpFromLine, Package, AlertTriangle, Upload, ShoppingCart, TrendingUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Image from "next/image";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { ProductModal } from "./product-modal";
import { StockMovementModal } from "./stock-movement-modal";
import { ImportModal } from "./import-modal";
import { SaleModal, CHANNEL_LABEL } from "./sale-modal";

type Product = inferRouterOutputs<AppRouter>["warehouse"]["product"]["list"][number];
type StockMovement = inferRouterOutputs<AppRouter>["warehouse"]["stockMovement"]["list"][number];
type Sale = inferRouterOutputs<AppRouter>["warehouse"]["sales"]["list"][number];

const euro = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WarehousePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(trpc.warehouse.product.list.queryOptions());
  const { data: stockMovements = [] } = useQuery(
    trpc.warehouse.stockMovement.list.queryOptions()
  );
  const salesListOptions = trpc.warehouse.sales.list.queryOptions();
  const { data: sales = [] } = useQuery(salesListOptions);
  const { data: report } = useQuery(trpc.warehouse.sales.report.queryOptions(undefined));
  const [searchTerm, setSearchTerm] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);

  const deleteSale = useMutation(
    trpc.warehouse.sales.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(salesListOptions);
        queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.stockMovement.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.sales.report.queryOptions(undefined));
        toast.success("Vendita stornata. Stock ripristinato.");
      },
      onError: (e) => toast.error(e.message),
    })
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Magazzino</h2>
          <p className="text-muted-foreground">Gestisci prodotti e movimenti di stock.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importa CSV
          </Button>
          <Button
            className="group"
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Nuovo prodotto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[480px]">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="sales">Vendite</TabsTrigger>
          <TabsTrigger value="history">Movimenti</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-center gap-4 border-b border-border/50">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtra per nome, SKU o categoria…"
                  className="pl-8 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Package className="h-10 w-10 opacity-30" />
                <p className="text-sm">
                  {searchTerm ? "Nessun prodotto trovato." : "Nessun prodotto ancora."}
                </p>
                {!searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductToEdit(null);
                      setIsProductModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi il primo
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded object-cover border border-border/50 shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        € {product.price.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const isLow = product.stockQuantity <= product.lowStockThreshold;
                          const isOut = product.stockQuantity === 0;
                          return (
                            <div className="flex items-center gap-2">
                              <Badge variant={isOut || isLow ? "destructive" : "secondary"}>
                                {product.stockQuantity} pz
                              </Badge>
                              {isLow && (
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-500"
                                  title={`Soglia: ${product.lowStockThreshold} pz`}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {isOut ? "Esaurito" : "Sotto soglia"}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductForStock(product);
                              setIsStockModalOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="w-4 h-4 mr-1" />
                            Movimento
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductToEdit(product);
                              setIsProductModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Modifica
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
            {stockMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <ArrowRightLeft className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nessun movimento registrato.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Quantità</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement: StockMovement) => (
                    <TableRow
                      key={movement.id}
                      className="border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(movement.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={movement.type === "in" ? "default" : "destructive"}
                          className="flex w-fit items-center gap-1"
                        >
                          {movement.type === "in" ? (
                            <ArrowDownToLine className="w-3 h-3" />
                          ) : (
                            <ArrowUpFromLine className="w-3 h-3" />
                          )}
                          {movement.type === "in" ? "Entrata" : "Uscita"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{movement.product.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {movement.product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-lg">
                        <span className={movement.type === "in" ? "text-green-600" : ""}>
                          {movement.type === "in" ? "+" : "-"}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Margin summary */}
          {report && report.salesCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Ricavi totali</p>
                <p className="text-2xl font-bold tracking-tight">{euro(report.totalRevenue)}</p>
              </div>
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Profitto totale</p>
                <p className={`text-2xl font-bold tracking-tight ${report.totalProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {euro(report.totalProfit)}
                </p>
              </div>
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Pezzi venduti</p>
                <p className="text-2xl font-bold tracking-tight">{report.totalUnits}</p>
              </div>
            </div>
          )}

          {report && report.byChannel.length > 0 && (
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-medium mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Margine per canale</p>
              <div className="flex flex-wrap gap-2">
                {report.byChannel.map((c) => (
                  <div key={c.channel} className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm">
                    <span className="font-medium">{CHANNEL_LABEL[c.channel] ?? c.channel}</span>
                    <span className="text-muted-foreground"> · {euro(c.profit)} profitto · {c.units} pz</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <span className="text-sm font-medium">Vendite registrate</span>
              <Button size="sm" onClick={() => setIsSaleOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Registra vendita
              </Button>
            </div>
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nessuna vendita registrata.</p>
                <Button variant="outline" size="sm" onClick={() => setIsSaleOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Registra la prima
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Canale</TableHead>
                    <TableHead className="text-right">Q.tà</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-right">Profitto</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s: Sale) => {
                    const profit = (s.unitPrice - s.unitCost) * s.quantity;
                    return (
                      <TableRow key={s.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                        <TableCell className="whitespace-nowrap text-sm">{format(new Date(s.soldAt), "d MMM yyyy", { locale: it })}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{s.product.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{s.product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{CHANNEL_LABEL[s.channel] ?? s.channel}</Badge></TableCell>
                        <TableCell className="text-right">{s.quantity}</TableCell>
                        <TableCell className="text-right">{euro(s.unitPrice)}</TableCell>
                        <TableCell className={`text-right font-medium ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>{euro(profit)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={deleteSale.isPending}
                            onClick={() => { if (confirm("Stornare questa vendita? Lo stock verrà ripristinato.")) deleteSale.mutate({ id: s.id }); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
      />
      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={productForStock}
      />
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <SaleModal isOpen={isSaleOpen} onClose={() => setIsSaleOpen(false)} />
    </div>
  );
}
