"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Users, Building2, User,
  Tag as TagIcon, Upload, Download, RotateCcw, AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTRPC } from "@/lib/trpc";
import { CustomerModal } from "./customer-modal";
import { ImportModal } from "./import-modal";
import { ContactDetailModal } from "./contact-detail-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Contact = inferRouterOutputs<AppRouter>["crm"]["contact"]["list"][number];
type DeletedContact = inferRouterOutputs<AppRouter>["crm"]["contact"]["listDeleted"][number];

export default function CustomersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"active" | "trash">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [filterTagId, setFilterTagId] = useState<string>("all");

  const { data: contacts = [], isLoading } = useQuery(trpc.crm.contact.list.queryOptions());
  const { data: deletedContacts = [], isLoading: isLoadingTrash } = useQuery(
    trpc.crm.contact.listDeleted.queryOptions()
  );
  const { data: tags = [] } = useQuery(trpc.crm.tag.list.queryOptions());

  const invalidateAll = () => {
    queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
    queryClient.invalidateQueries(trpc.crm.contact.listDeleted.queryOptions());
  };

  const deleteContact = useMutation(
    trpc.crm.contact.delete.mutationOptions({
      onSuccess: () => { invalidateAll(); setDetailContact(null); toast.success("Contatto spostato nel cestino."); },
      onError: () => toast.error("Errore durante l'eliminazione."),
    })
  );

  const restoreContact = useMutation(
    trpc.crm.contact.restore.mutationOptions({
      onSuccess: () => { invalidateAll(); toast.success("Contatto ripristinato."); },
      onError: () => toast.error("Errore durante il ripristino."),
    })
  );

  const hardDeleteContact = useMutation(
    trpc.crm.contact.hardDelete.mutationOptions({
      onSuccess: () => { invalidateAll(); toast.success("Contatto eliminato definitivamente."); },
      onError: () => toast.error("Errore durante l'eliminazione definitiva."),
    })
  );

  const filtered = filterTagId && filterTagId !== "all"
    ? contacts.filter((c) => c.tags.some((ct) => ct.tag.id === filterTagId))
    : contacts;

  const companies = contacts.filter((c) => c.type === "company");

  function exportCSV() {
    const rows = filtered.length > 0 ? filtered : contacts;
    const header = ["id", "nome", "tipo", "azienda_padre", "azienda", "email", "telefono", "stato", "owner", "tag"];
    const lines = rows.map((c) => [
      c.id, c.name, c.type, c.parent?.name ?? "", c.company ?? "",
      c.email ?? "", c.phone ?? "", c.status, c.owner?.name ?? "",
      c.tags.map((ct) => ct.tag.name).join(";"),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contatti_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openCreate() { setEditContact(null); setModalOpen(true); }
  function openEdit(contact: Contact, e: React.MouseEvent) {
    e.stopPropagation(); setEditContact(contact); setModalOpen(true);
  }
  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("Spostare nel cestino? Verrà eliminato definitivamente dopo 30 giorni."))
      deleteContact.mutate({ id });
  }

  // ── Trash view ────────────────────────────────────────────────────────────
  if (view === "trash") {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cestino</h2>
            <p className="text-muted-foreground mt-1">
              I contatti vengono eliminati definitivamente dopo 30 giorni.
            </p>
          </div>
          <Button variant="outline" onClick={() => setView("active")}>
            ← Torna ai contatti
          </Button>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
          {isLoadingTrash ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : deletedContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Trash2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">Il cestino è vuoto.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Eliminato il</TableHead>
                  <TableHead>Eliminazione definitiva</TableHead>
                  <TableHead className="w-[160px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedContacts.map((c: DeletedContact) => {
                  const deletedAt = new Date(c.deletedAt!);
                  const purgeAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const daysLeft = Math.ceil((purgeAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={c.id} className="opacity-70">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.type === "company" ? "Azienda" : "Persona"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(deletedAt, "d MMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={daysLeft <= 3 ? "destructive" : "outline"} className="text-xs">
                          {daysLeft > 0 ? `tra ${daysLeft} gg` : "oggi"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => restoreContact.mutate({ id: c.id })}
                            disabled={restoreContact.isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Ripristina
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Eliminare definitivamente? Non sarà recuperabile."))
                                hardDeleteContact.mutate({ id: c.id });
                            }}
                            disabled={hardDeleteContact.isPending}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  }

  // ── Active contacts view ──────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contatti</h2>
          <p className="text-muted-foreground mt-1">Gestisci persone e aziende.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => setView("trash")} className="relative">
            <Trash2 className="mr-2 h-4 w-4" />
            Cestino
            {deletedContacts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0 h-4">
                {deletedContacts.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />Importa CSV
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={contacts.length === 0}>
            <Download className="mr-2 h-4 w-4" />Esporta CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Nuovo contatto
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-3">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={filterTagId} onValueChange={setFilterTagId}>
            <SelectTrigger className="w-[200px] h-8 text-sm bg-card/40 border-border/50">
              <SelectValue placeholder="Filtra per tag…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i contatti</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterTagId !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterTagId("all")}>
              Rimuovi filtro
            </Button>
          )}
        </div>
      )}

      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">{filterTagId !== "all" ? "Nessun contatto con questo tag." : "Nessun contatto ancora."}</p>
            {filterTagId === "all" && (
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />Aggiungi il primo
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailContact(contact)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {contact.type === "company"
                        ? <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <User className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {contact.name}
                      {contact.type === "company" && contact.persons.length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">{contact.persons.length}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.parent?.name ?? contact.company ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.email ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((ct) => (
                        <Badge key={ct.tag.id} variant="outline" className="text-xs">{ct.tag.name}</Badge>
                      ))}
                      {contact.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{contact.tags.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      contact.status === "active" ? "default" :
                      contact.status === "customer" ? "default" : "secondary"
                    } className={contact.status === "customer" ? "bg-green-600 hover:bg-green-700" : ""}>
                      {contact.status === "active" ? "Attivo" : contact.status === "customer" ? "Cliente" : "Inattivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={(e) => openEdit(contact, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(contact.id, e)}
                        disabled={deleteContact.isPending}>
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

      <ContactDetailModal
        contact={detailContact}
        contacts={contacts}
        onClose={() => setDetailContact(null)}
        onNavigate={(c) => setDetailContact(c)}
        onEdit={() => { setEditContact(detailContact); setModalOpen(true); }}
        onDelete={() => {
          if (confirm("Spostare nel cestino? Verrà eliminato definitivamente dopo 30 giorni."))
            deleteContact.mutate({ id: detailContact!.id });
        }}
        onAddPerson={() => { setEditContact(null); setModalOpen(true); }}
        isDeleting={deleteContact.isPending}
      />

      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditContact(null); }}
        contactToEdit={editContact}
        companies={companies}
        defaultParentId={detailContact?.type === "company" ? detailContact.id : undefined}
      />
    </div>
  );
}
