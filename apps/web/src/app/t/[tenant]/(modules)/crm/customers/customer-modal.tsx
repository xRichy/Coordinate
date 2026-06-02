"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
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
  ownerId: z.string().optional(),
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
  isOpen, onClose, contactToEdit, companies = [], defaultParentId,
}: CustomerModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: allTags = [] } = useQuery(trpc.crm.tag.list.queryOptions());
  const { data: members = [] } = useQuery(trpc.crm.contact.listMembers.queryOptions());

  const createTag = useMutation(trpc.crm.tag.create.mutationOptions({
    onSuccess: (tag) => {
      queryClient.invalidateQueries(trpc.crm.tag.list.queryOptions());
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setTagInput("");
    },
  }));

  const invalidateContacts = () =>
    queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());

  const createContact = useMutation(
    trpc.crm.contact.create.mutationOptions({
      onSuccess: () => { invalidateContacts(); toast.success("Contatto creato."); onClose(); },
    })
  );
  const updateContact = useMutation(
    trpc.crm.contact.update.mutationOptions({
      onSuccess: () => { invalidateContacts(); toast.success("Contatto aggiornato."); onClose(); },
    })
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "", type: "person", company: "", email: "",
      phone: "", status: "active", parentId: defaultParentId ?? "", ownerId: "",
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
          ownerId: contactToEdit.ownerId ?? "",
        });
        setSelectedTagIds(contactToEdit.tags.map((ct) => ct.tag.id));
      } else {
        form.reset({
          name: "", type: "person", company: "", email: "",
          phone: "", status: "active", parentId: defaultParentId ?? "", ownerId: "",
        });
        setSelectedTagIds([]);
      }
      setTagInput("");
    }
  }, [contactToEdit, isOpen, form, defaultParentId]);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const name = tagInput.trim();
      if (!name) return;
      const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (!selectedTagIds.includes(existing.id))
          setSelectedTagIds((prev) => [...prev, existing.id]);
        setTagInput("");
      } else {
        createTag.mutate({ name });
      }
    }
  }

  function removeTag(id: string) {
    setSelectedTagIds((prev) => prev.filter((t) => t !== id));
  }

  function onSubmit(values: ContactFormValues) {
    const payload = {
      name: values.name,
      type: values.type as "person" | "company",
      company: values.company || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      status: values.status as "active" | "inactive",
      parentId: values.parentId || undefined,
      ownerId: values.ownerId || undefined,
      tagIds: selectedTagIds,
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
  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{contactToEdit ? "Modifica contatto" : "Nuovo contatto"}</DialogTitle>
          <DialogDescription>
            {contactToEdit ? "Modifica i dati del contatto." : "Inserisci i dati del nuovo contatto."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control} name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="Mario Rossi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type"
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
              <FormField control={form.control} name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="inactive">Inattivo</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedType === "person" && parentCompanies.length > 0 && (
              <FormField control={form.control} name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azienda di appartenenza</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Nessuna" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessuna</SelectItem>
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

            {/* Owner */}
            {members.length > 0 && (
              <FormField control={form.control} name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Nessuno" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessuno</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField control={form.control} name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Azienda (testo libero)</FormLabel>
                  <FormControl><Input placeholder="Rossi Srl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="mario@rossisrl.it" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl><Input placeholder="+39 02 1234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Chip-input tag */}
            <div>
              <p className="text-sm font-medium mb-1.5">Tag</p>
              <div
                className="flex flex-wrap gap-1.5 min-h-[38px] border border-border/50 rounded-md px-3 py-2 bg-background/50 cursor-text"
                onClick={() => tagInputRef.current?.focus()}
              >
                {selectedTags.map((t) => (
                  <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                    {t.name}
                    <button type="button" onClick={() => removeTag(t.id)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={selectedTags.length === 0 ? "Digita un tag e premi Invio…" : ""}
                  className="flex-1 min-w-[120px] text-sm bg-transparent outline-none"
                />
                {tagInput && (
                  <button
                    type="button"
                    className="text-xs text-primary flex items-center gap-1"
                    onClick={() => {
                      const name = tagInput.trim();
                      if (!name) return;
                      const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
                      if (existing) {
                        if (!selectedTagIds.includes(existing.id))
                          setSelectedTagIds((prev) => [...prev, existing.id]);
                        setTagInput("");
                      } else {
                        createTag.mutate({ name });
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    {tagInput}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Invio o virgola per aggiungere</p>
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
