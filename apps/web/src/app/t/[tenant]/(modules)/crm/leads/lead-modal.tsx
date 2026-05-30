"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const leadSchema = z.object({
  title: z.string().min(2, "Il titolo deve avere almeno 2 caratteri"),
  contactName: z.string().optional(),
  value: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createLead = useMutation(
    trpc.crm.lead.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.crm.lead.list.queryOptions());
        toast.success("Lead creato.");
        onClose();
      },
      onError: () => toast.error("Errore durante la creazione."),
    })
  );

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { title: "", contactName: "", value: "" },
  });

  function onSubmit(values: LeadFormValues) {
    const numValue = values.value ? parseFloat(values.value) : 0;
    createLead.mutate({
      title: values.title,
      contactName: values.contactName || undefined,
      value: isNaN(numValue) ? 0 : numValue,
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Nuovo lead</DialogTitle>
          <DialogDescription>Aggiungi un&apos;opportunità di vendita alla pipeline.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Fornitura software Q3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contatto</FormLabel>
                  <FormControl>
                    <Input placeholder="Mario Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valore (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={createLead.isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? "Creazione…" : "Crea lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
