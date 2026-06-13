"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";

const schema = z.object({
  title: z.string().min(2, "Il titolo deve avere almeno 2 caratteri"),
  type: z.enum(["meeting", "call", "task", "note"]),
  priority: z.enum(["low", "medium", "high"]),
});

type FormValues = z.infer<typeof schema>;

interface EventCreateModalProps {
  /** The day clicked on the calendar; `null` keeps the modal closed. */
  date: Date | null;
  onClose: () => void;
}

export function EventCreateModal({ date, onClose }: EventCreateModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", type: "meeting", priority: "medium" },
  });

  const createActivity = useMutation(
    trpc.activities.activity.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions());
        toast.success("Attività creata.");
        form.reset();
        onClose();
      },
      onError: () => toast.error("Errore durante la creazione."),
    })
  );

  function onSubmit(values: FormValues) {
    if (!date) return;
    // Anchor the due time at 09:00 local so the activity lands on the clicked day.
    const due = new Date(date);
    due.setHours(9, 0, 0, 0);
    createActivity.mutate({
      title: values.title,
      type: values.type,
      priority: values.priority,
      dueDate: due.toISOString(),
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) { form.reset(); onClose(); }
  }

  return (
    <Dialog open={!!date} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Nuova attività</DialogTitle>
        </DialogHeader>

        {date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground -mt-1">
            <CalendarClock className="h-4 w-4" />
            <span className="capitalize">{format(date, "EEEE d MMMM yyyy", { locale: it })}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Riunione con Mario" autoFocus {...field} />
                  </FormControl>
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
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meeting">Riunione</SelectItem>
                        <SelectItem value="call">Chiamata</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="note">Nota</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorità</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Bassa</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={createActivity.isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? "Creazione…" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
