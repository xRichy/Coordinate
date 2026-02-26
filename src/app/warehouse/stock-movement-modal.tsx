"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore, Product } from "@/store/useAppStore";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

const stockMovementSchema = z.object({
    type: z.enum(["In", "Out"]),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    note: z.string().optional(),
});

type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export function StockMovementModal({ isOpen, onClose, product }: StockMovementModalProps) {
    const { addStockMovement } = useAppStore();

    const form = useForm<z.infer<typeof stockMovementSchema>>({
        resolver: zodResolver(stockMovementSchema),
        defaultValues: {
            type: "In",
            quantity: 1,
            note: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                type: "In",
                quantity: 1,
                note: "",
            });
        }
    }, [isOpen, form]);

    const onSubmit = (values: StockMovementFormValues) => {
        if (!product) return;

        // Validation for stock going out
        if (values.type === "Out" && values.quantity > product.stockQuantity) {
            form.setError("quantity", { message: `Cannot remove more than current stock (${product.stockQuantity})` });
            return;
        }

        addStockMovement({
            id: Math.random().toString(36).substring(7),
            productId: product.id,
            date: new Date().toISOString(),
            ...values,
        });
        toast("Stock movement recorded.");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Stock Movement</DialogTitle>
                    <DialogDescription>
                        {product && `Modifying stock for ${product.name} (SKU: ${product.sku}). Current stock: ${product.stockQuantity}`}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Movement Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select movement type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="In">Stock In (+)</SelectItem>
                                            <SelectItem value="Out">Stock Out (-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Reason for movement..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">Record Movement</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
