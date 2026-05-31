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

type Contact = inferRouterOutputs<AppRouter>["crm"]["contact"]["list"][number];

const contactSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  type: z.enum(["person", "company"]),
  company: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  parentId: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactToEdit?: Contact | null;
  companies?: Contact[];
  defaultParentId?: string;
}

export function CustomerModal({
  isOpen,
  onClose,
  contactToEdit,
  companies = [],
  defaultParentId,
}: CustomerModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());

  const createContact = useMutation(
    trpc.crm.contact.create.mutationOptions({
      onSuccess: () => { invalidate(); toast.success("Contatto creato."); onClose(); },
    })
  );

  const updateContact = useMutation(
    trpc.crm.contact.update.mutationOptions({
      onSuccess: () => { invalidate(); toast.success("Contatto aggiornato."); onClose(); },
    })
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "", type: "person", company: "", email: "",
      phone: "", status: "active", parentId: defaultParentId ?? "",
    },
  });

  const watchedType = form.watch("type");

  useEffect(() => {
    if (isOpen) {
      if (contactToEdit) {
        form.reset({
          name: contactToEdit.name,
          type: (contactToEdit.type as "person" | "company") ?? "person",
          company: contactToEdit.company ?? "",
          email: contactToEdit.email ?? "",
          phone: contactToEdit.phone ?? "",
          status: (contactToEdit.status as "active" | "inactive") ?? "active",
          parentId: contactToEdit.parentId ?? "",
        });
      } else {
        form.reset({
          name: "", type: "person", company: "", email: "",
          phone: "", status: "active", parentId: defaultParentId ?? "",
        });
      }
    }
  }, [contactToEdit, isOpen, form, defaultParentId]);

  function onSubmit(values: ContactFormValues) {
    const payload = {
      name: values.name,
      type: values.type as "person" | "company",
      company: values.company || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      status: values.status as "active" | "inactive",
      parentId: values.parentId || undefined,
    };

    if (contactToEdit) {
      updateContact.mutate({ id: contactToEdit.id, data: payload });
    } else {
      createContact.mutate(payload);
    }
  }

  const isPending = createContact.isPending || updateContact.isPending;
  const parentCompanies = companies.filter((c) =>
    c.type === "company" && c.id !== contactToEdit?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{contactToEdit ? "Modifica contatto" : "Nuovo contatto"}</DialogTitle>
          <DialogDescription>
            {contactToEdit ? "Modifica i dati del contatto." : "Inserisci i dati del nuovo contatto."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="Mario Rossi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="person">Persona</SelectItem>
                        <SelectItem value="company">Azienda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="inactive">Inattivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Azienda di appartenenza (solo per persone) */}
            {watchedType === "person" && parentCompanies.length > 0 && (
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azienda di appartenenza</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Nessuna" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Nessuna</SelectItem>
                        {parentCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Azienda (testo libero)</FormLabel>
                  <FormControl><Input placeholder="Rossi Srl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="mario@rossisrl.it" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl><Input placeholder="+39 02 1234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio…" : contactToEdit ? "Salva" : "Crea contatto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
