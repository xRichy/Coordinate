"use client";

import {
  Dialog, DialogContent, DialogHeader,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2, User, Pencil, Trash2, Mail, Phone,
  UserCircle, Tag, ChevronRight, Plus, Clock,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import { EntityTimeline } from "@/components/timeline/entity-timeline";

type Contact = inferRouterOutputs<AppRouter>["crm"]["contact"]["list"][number];

interface ContactDetailModalProps {
  contact: Contact | null;
  contacts: Contact[];
  onClose: () => void;
  onNavigate: (contact: Contact) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPerson: () => void;
  isDeleting?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Attivo",
  customer: "Cliente",
  inactive: "Inattivo",
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  customer: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
};

function Avatar({ contact }: { contact: Contact }) {
  const isCompany = contact.type === "company";
  const initial = contact.name.charAt(0).toUpperCase();
  return (
    <div className={`
      flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-semibold shrink-0
      ${isCompany
        ? "bg-primary/10 text-primary border border-primary/20"
        : "bg-violet-500/10 text-violet-400 border border-violet-500/20"}
    `}>
      {initial}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function ContactDetailModal({
  contact,
  contacts,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onAddPerson,
  isDeleting,
}: ContactDetailModalProps) {
  if (!contact) return null;

  const isCompany = contact.type === "company";

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="sr-only">
          <span>{contact.name}</span>
        </DialogHeader>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative px-7 pt-7 pb-6 bg-gradient-to-b from-muted/40 to-transparent">
          <div className="flex items-start gap-4">
            <Avatar contact={contact} />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-lg font-semibold leading-tight truncate">{contact.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isCompany
                    ? <Building2 className="h-3.5 w-3.5" />
                    : <User className="h-3.5 w-3.5" />}
                  {isCompany ? "Azienda" : "Persona"}
                </span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className={`
                  inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium
                  ${STATUS_CLASS[contact.status] ?? STATUS_CLASS.inactive}
                `}>
                  {STATUS_LABEL[contact.status] ?? contact.status}
                </span>
              </div>
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {contact.tags.map((ct) => (
                    <Badge
                      key={ct.tag.id}
                      variant="outline"
                      className="text-xs h-5 px-2 bg-background/50 border-border/60"
                    >
                      {ct.tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="px-7 pb-2 space-y-4">
          <Separator className="opacity-50" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {contact.email && (
              <InfoRow
                icon={Mail}
                label="Email"
                value={
                  <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors truncate block">
                    {contact.email}
                  </a>
                }
              />
            )}
            {contact.phone && (
              <InfoRow
                icon={Phone}
                label="Telefono"
                value={<span className="tabular-nums">{contact.phone}</span>}
              />
            )}
            {contact.owner && (
              <InfoRow
                icon={UserCircle}
                label="Owner"
                value={contact.owner.name}
              />
            )}
            {!isCompany && contact.parent && (
              <InfoRow
                icon={Building2}
                label="Azienda"
                value={
                  <button
                    className="flex items-center gap-1 text-primary hover:underline"
                    onClick={() => {
                      const parent = contacts.find((c) => c.id === contact.parent!.id);
                      if (parent) onNavigate(parent);
                    }}
                  >
                    {contact.parent.name}
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                }
              />
            )}
          </div>

          {/* ── Persone (solo per aziende) ─────────────────────────────── */}
          {isCompany && (
            <>
              <Separator className="opacity-50" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <InfoRow
                    icon={Tag}
                    label={`Persone associate (${contact.persons.length})`}
                    value={null}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={onAddPerson}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Aggiungi
                  </Button>
                </div>
                {contact.persons.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-10">Nessuna persona associata.</p>
                ) : (
                  <ul className="space-y-1 pl-2">
                    {contact.persons.map((p) => (
                      <li key={p.id}>
                        <button
                          className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors group"
                          onClick={() => {
                            const full = contacts.find((c) => c.id === p.id);
                            if (full) onNavigate(full);
                          }}
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.email && (
                              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                            )}
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <Separator className="opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-wider">Timeline</p>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1">
              <EntityTimeline contactId={contact.id} />
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-7 py-5 mt-2 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            Elimina
          </Button>
          <Button size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Modifica
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
