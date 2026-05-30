"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowRightLeft, Edit2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ProductModal } from "./product-modal";
import { StockMovementModal } from "./stock-movement-modal";
import { useTRPC } from "@/lib/trpc";

type Product = inferRouterOutputs<AppRouter>["warehouse"]["product"]["list"][number];
type StockMovement = inferRouterOutputs<AppRouter>["warehouse"]["stockMovement"]["list"][number];

export default function WarehousePage() {
    const trpc = useTRPC();
    const { data: products = [] } = useQuery(trpc.warehouse.product.list.queryOptions());
    const { data: stockMovements = [] } = useQuery(trpc.warehouse.stockMovement.list.queryOptions());
    const [searchTerm, setSearchTerm] = useState("");

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [productForStock, setProductForStock] = useState<Product | null>(null);

    const filteredProducts = products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenAddProduct = () => {
        setProductToEdit(null);
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };

    const handleOpenStockMovement = (product: Product) => {
        setProductForStock(product);
        setIsStockModalOpen(true);
    };

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Warehouse</h2>
                    <p className="text-muted-foreground">Manage your product inventory and stock levels.</p>
                </div>
                <Button className="shrink-0 group" onClick={handleOpenAddProduct}>
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                    Add Product
                </Button>
            </div>

            <Tabs defaultValue="inventory" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="history">Movement History</TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="space-y-4">
                    <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm p-3">
                        <div className="p-4 flex items-center gap-4 border-b border-border/50">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter products by name, SKU, or category..."
                                    className="pl-8 bg-background/50 border-border/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent border-border/50">
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product: Product) => (
                                        <TableRow key={product.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium">{product.sku}</TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.category}</Badge>
                                            </TableCell>
                                            <TableCell>${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={product.stockQuantity > 10 ? "secondary" : product.stockQuantity > 0 ? "default" : "destructive"}
                                                >
                                                    {product.stockQuantity} In Stock
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenStockMovement(product)}>
                                                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                        Move
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditProduct(product)}>
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm p-3">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent border-border/50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockMovements.length > 0 ? (
                                    [...stockMovements].reverse().map((movement: StockMovement) => {
                                        const product = products.find((p: Product) => p.id === movement.productId);
                                        return (
                                            <TableRow key={movement.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {format(new Date(movement.date), 'MMM d, yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={movement.type === "In" ? "default" : "destructive"} className="flex w-fit items-center gap-1">
                                                        {movement.type === "In" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                                                        {movement.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {product ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className="text-xs text-muted-foreground">{product.sku}</span>
                                                        </div>
                                                    ) : "Unknown Product"}
                                                </TableCell>
                                                <TableCell className="font-medium text-lg">
                                                    <span className={movement.type === "In" ? "text-green-600 dark:text-green-500" : ""}>
                                                        {movement.type === "In" ? "+" : "-"}{movement.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {movement.note || "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No stock movements recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
        </div>
    );
}
