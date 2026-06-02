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
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";

type Product = inferRouterOutputs<AppRouter>["warehouse"]["product"]["list"][number];

const productSchema = z.object({
  sku: z.string().min(2, "SKU obbligatorio"),
  name: z.string().min(2, "Nome obbligatorio"),
  category: z.string().min(2, "Categoria obbligatoria"),
  price: z.number().positive("Il prezzo deve essere positivo"),
  stockQuantity: z.number().int().nonnegative("La quantità non può essere negativa"),
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
        toast.success("Prodotto creato.");
        onClose();
      },
      onError: () => toast.error("Errore durante la creazione."),
    })
  );

  const updateProduct = useMutation(
    trpc.warehouse.product.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.warehouse.product.list.queryOptions());
        toast.success("Prodotto aggiornato.");
        onClose();
      },
      onError: () => toast.error("Errore durante l'aggiornamento."),
    })
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { sku: "", name: "", category: "", price: 0, stockQuantity: 0 },
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
      form.reset({ sku: "", name: "", category: "", price: 0, stockQuantity: 0 });
    }
  }, [productToEdit, form, isOpen]);

  function onSubmit(values: ProductFormValues) {
    if (productToEdit) {
      updateProduct.mutate({ id: productToEdit.id, data: values });
    } else {
      createProduct.mutate(values);
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle>
          <DialogDescription>
            {productToEdit
              ? "Modifica le proprietà del prodotto."
              : "Inserisci i dati del nuovo prodotto."}
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
                  <FormLabel>Nome</FormLabel>
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
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Componenti" {...field} />
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
                    <FormLabel>Prezzo (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
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
                    <FormLabel>Stock iniziale</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio…" : productToEdit ? "Salva" : "Crea prodotto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
