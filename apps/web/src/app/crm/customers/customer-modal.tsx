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
    DialogFooter
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

const customerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    company: z.string().min(2, "Company must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(5, "Phone number is required"),
    status: z.enum(["Active", "Inactive"]),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerToEdit?: Contact | null;
}

export function CustomerModal({ isOpen, onClose, customerToEdit }: CustomerModalProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createContact = useMutation(
        trpc.crm.contact.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
                toast("Customer created successfully.");
                onClose();
            },
        })
    );

    const updateContact = useMutation(
        trpc.crm.contact.update.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.crm.contact.list.queryOptions());
                toast("Customer updated successfully.");
                onClose();
            },
        })
    );

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            company: "",
            email: "",
            phone: "",
            status: "Active",
        },
    });

    useEffect(() => {
        if (customerToEdit) {
            form.reset({
                name: customerToEdit.name,
                company: customerToEdit.company,
                email: customerToEdit.email,
                phone: customerToEdit.phone,
                status: customerToEdit.status,
            });
        } else {
            form.reset({
                name: "",
                company: "",
                email: "",
                phone: "",
                status: "Active",
            });
        }
    }, [customerToEdit, form, isOpen]);

    const onSubmit = (values: CustomerFormValues) => {
        if (customerToEdit) {
            updateContact.mutate({ id: customerToEdit.id, data: values });
        } else {
            createContact.mutate(values);
        }
    };

    const isPending = createContact.isPending || updateContact.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customerToEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
                    <DialogDescription>
                        {customerToEdit
                            ? "Make changes to the customer profile here. Click save when you're done."
                            : "Enter the details of the new customer below."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} />
                                    </FormControl>
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
                                        <FormControl>
                                            <Input placeholder="john@acme.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 555 1234" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>Save changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
