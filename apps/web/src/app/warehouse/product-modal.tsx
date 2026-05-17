"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";

type Product = inferRouterOutputs<AppRouter>["warehouse"]["product"]["list"][number];

const productSchema = z.object({
    sku: z.string().min(2, "SKU is required"),
    name: z.string().min(2, "Product name is required"),
    category: z.string().min(2, "Category is required"),
    price: z.number().positive("Price must be positive"),
    stockQuantity: z.number().int().nonnegative("Stock quantity cannot be negative"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: Product | null;
}

export function ProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createProduct = useMutation(
        trpc.warehouse.product.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
                toast("Product created successfully.");
                onClose();
            },
        })
    );

    const updateProduct = useMutation(
        trpc.warehouse.product.update.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
                toast("Product updated successfully.");
                onClose();
            },
        })
    );

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            name: "",
            category: "",
            price: 0,
            stockQuantity: 0,
        },
    });

    useEffect(() => {
        if (productToEdit) {
            form.reset({
                sku: productToEdit.sku,
                name: productToEdit.name,
                category: productToEdit.category,
                price: productToEdit.price,
                stockQuantity: productToEdit.stockQuantity,
            });
        } else {
            form.reset({
                sku: "",
                name: "",
                category: "",
                price: 0,
                stockQuantity: 0,
            });
        }
    }, [productToEdit, form, isOpen]);

    const onSubmit = (values: ProductFormValues) => {
        if (productToEdit) {
            updateProduct.mutate({ id: productToEdit.id, data: values });
        } else {
            createProduct.mutate(values);
        }
    };

    const isPending = createProduct.isPending || updateProduct.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{productToEdit ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {productToEdit
                            ? "Make changes to the product properties here."
                            : "Enter the details of the new product."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU</FormLabel>
                                    <FormControl>
                                        <Input placeholder="PRD-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Widget A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Components" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stockQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>Save Product</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
