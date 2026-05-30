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
  DialogFooter,
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
import { useTRPC } from "@/lib/trpc";

type Product = inferRouterOutputs<AppRouter>["warehouse"]["product"]["list"][number];

const stockMovementSchema = z.object({
  type: z.enum(["in", "out"]),
  quantity: z.number().int().positive("La quantità deve essere un intero positivo"),
  note: z.string().optional(),
});

type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function StockMovementModal({ isOpen, onClose, product }: StockMovementModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const recordMovement = useMutation(
    trpc.warehouse.stockMovement.record.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.warehouse.stockMovement.list.queryOptions());
        queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
        toast.success("Movimento registrato.");
        onClose();
      },
      onError: () => toast.error("Errore durante la registrazione."),
    })
  );

  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { type: "in", quantity: 1, note: "" },
  });

  useEffect(() => {
    if (isOpen) form.reset({ type: "in", quantity: 1, note: "" });
  }, [isOpen, form]);

  function onSubmit(values: StockMovementFormValues) {
    if (!product) return;
    if (values.type === "out" && values.quantity > product.stockQuantity) {
      form.setError("quantity", {
        message: `Non puoi prelevare più dello stock attuale (${product.stockQuantity})`,
      });
      return;
    }
    recordMovement.mutate({
      productId: product.id,
      type: values.type as "in" | "out",
      quantity: values.quantity,
      note: values.note,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registra movimento</DialogTitle>
          <DialogDescription>
            {product &&
              `${product.name} (SKU: ${product.sku}) — stock attuale: ${product.stockQuantity}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo movimento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in">Entrata (+)</SelectItem>
                      <SelectItem value="out">Uscita (-)</SelectItem>
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
                  <FormLabel>Quantità</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                    />
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
                  <FormLabel>Nota (opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="Motivo del movimento…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={recordMovement.isPending}>
                {recordMovement.isPending ? "Registrazione…" : "Registra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
