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

const activitySchema = z.object({
  title: z.string().min(2, "Il titolo deve avere almeno 2 caratteri"),
  type: z.enum(["task", "call", "meeting", "note"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createActivity = useMutation(
    trpc.activities.activity.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.activities.activity.list.queryOptions());
        toast.success("Attività creata.");
        onClose();
      },
      onError: () => toast.error("Errore durante la creazione."),
    })
  );

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { title: "", type: "task", priority: "medium", dueDate: "" },
  });

  function onSubmit(values: ActivityFormValues) {
    createActivity.mutate({
      title: values.title,
      type: values.type as "task" | "call" | "meeting" | "note",
      priority: values.priority as "low" | "medium" | "high",
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
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
          <DialogTitle>Nuova attività</DialogTitle>
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
                    <Input placeholder="Chiamata follow-up con Mario" {...field} />
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="call">Chiamata</SelectItem>
                        <SelectItem value="meeting">Riunione</SelectItem>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scadenza</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
