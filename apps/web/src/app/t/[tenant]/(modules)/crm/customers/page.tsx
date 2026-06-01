"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Building2, User, ChevronRight, Tag as TagIcon, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc";
import { CustomerModal } from "./customer-modal";
import { ImportModal } from "./import-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";

type Contact = inferRouterOutputs<AppRouter>["crm"]["contact"]["list"][number];

export default function CustomersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [filterTagId, setFilterTagId] = useState<string>("");

  const { data: contacts = [], isLoading } = useQuery(trpc.crm.contact.list.queryOptions());
  const { data: tags = [] } = useQuery(trpc.crm.tag.list.queryOptions());

  const deleteContact = useMutation(
    trpc.crm.contact.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
        setDetailContact(null);
        toast.success("Contatto eliminato.");
      },
      onError: () => toast.error("Errore durante l'eliminazione."),
    })
  );

  const filtered = filterTagId
    ? contacts.filter((c) => c.tags.some((ct) => ct.tag.id === filterTagId))
    : contacts;

  const companies = contacts.filter((c) => c.type === "company");

  function exportCSV() {
    const rows = filtered.length > 0 ? filtered : contacts;
    const header = ["id", "nome", "tipo", "azienda_padre", "azienda", "email", "telefono", "stato", "owner", "tag"];
    const lines = rows.map((c) => [
      c.id,
      c.name,
      c.type,
      c.parent?.name ?? "",
      c.company ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.status,
      c.owner?.name ?? "",
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
    if (confirm("Eliminare questo contatto?")) deleteContact.mutate({ id });
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contatti</h2>
          <p className="text-muted-foreground mt-1">Gestisci persone e aziende.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importa CSV
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={contacts.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo contatto
          </Button>
        </div>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex items-center gap-3">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={filterTagId} onValueChange={setFilterTagId}>
            <SelectTrigger className="w-[200px] h-8 text-sm bg-card/40 border-border/50">
              <SelectValue placeholder="Filtra per tag…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti i contatti</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterTagId && (
            <Button variant="ghost" size="sm" onClick={() => setFilterTagId("")}>
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
            <p className="text-sm">{filterTagId ? "Nessun contatto con questo tag." : "Nessun contatto ancora."}</p>
            {!filterTagId && (
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
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailContact(contact)}>
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
                    <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                      {contact.status === "active" ? "Attivo" : "Inattivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEdit(contact, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(contact.id, e)} disabled={deleteContact.isPending}
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

      {/* Detail sheet */}
      <Sheet open={!!detailContact} onOpenChange={(open) => !open && setDetailContact(null)}>
        <SheetContent className="w-[400px] sm:w-[480px]">
          {detailContact && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-2">
                  {detailContact.type === "company"
                    ? <Building2 className="h-5 w-5 text-primary" />
                    : <User className="h-5 w-5 text-primary" />}
                  <SheetTitle>{detailContact.name}</SheetTitle>
                </div>
                <SheetDescription>
                  {detailContact.type === "company" ? "Azienda" : "Persona"} ·{" "}
                  {detailContact.status === "active" ? "Attivo" : "Inattivo"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                {detailContact.email && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Email</p>
                    <p>{detailContact.email}</p>
                  </div>
                )}
                {detailContact.phone && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Telefono</p>
                    <p>{detailContact.phone}</p>
                  </div>
                )}
                {detailContact.owner && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Owner</p>
                    <p>{detailContact.owner.name}</p>
                  </div>
                )}
                {detailContact.tags.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tag</p>
                    <div className="flex flex-wrap gap-1">
                      {detailContact.tags.map((ct) => (
                        <Badge key={ct.tag.id} variant="outline">{ct.tag.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detailContact.type === "person" && detailContact.parent && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Azienda</p>
                    <button
                      className="flex items-center gap-2 text-primary hover:underline"
                      onClick={() => {
                        const parent = contacts.find((c) => c.id === detailContact.parent!.id);
                        if (parent) setDetailContact(parent);
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                      {detailContact.parent.name}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {detailContact.type === "company" && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                        Persone ({detailContact.persons.length})
                      </p>
                      {detailContact.persons.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nessuna persona associata.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detailContact.persons.map((p) => (
                            <li key={p.id}>
                              <button
                                className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1.5 transition-colors"
                                onClick={() => { const full = contacts.find((c) => c.id === p.id); if (full) setDetailContact(full); }}
                              >
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{p.name}</p>
                                  {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                                </div>
                                <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button variant="outline" size="sm" className="mt-3 w-full"
                        onClick={() => { setEditContact(null); setModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Aggiungi persona
                      </Button>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1"
                    onClick={() => { setEditContact(detailContact); setModalOpen(true); }}>
                    <Pencil className="mr-2 h-4 w-4" />Modifica
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Eliminare?")) deleteContact.mutate({ id: detailContact.id }); }}
                    disabled={deleteContact.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
