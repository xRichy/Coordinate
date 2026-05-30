"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc";
import { CustomerModal } from "./customer-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Contact = inferRouterOutputs<AppRouter>["crm"]["contact"]["list"][number];

export default function CustomersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useQuery(
    trpc.crm.contact.list.queryOptions()
  );

  const deleteContact = useMutation(
    trpc.crm.contact.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
        toast.success("Contatto eliminato.");
      },
      onError: () => {
        toast.error("Errore durante l'eliminazione.");
      },
    })
  );

  function openCreate() {
    setEditContact(null);
    setModalOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditContact(contact);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("Eliminare questo contatto?")) {
      deleteContact.mutate({ id });
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contatti</h2>
          <p className="text-muted-foreground mt-1">
            Gestisci i tuoi contatti e clienti.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo contatto
        </Button>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nessun contatto ancora.</p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi il primo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {contact.type === "company" ? "Azienda" : "Persona"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.company ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={contact.status === "active" ? "default" : "secondary"}
                    >
                      {contact.status === "active" ? "Attivo" : "Inattivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deleteContact.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contactToEdit={editContact}
      />
    </div>
  );
}
