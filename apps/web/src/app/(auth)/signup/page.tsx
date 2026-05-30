"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Target, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { getTenantDashboardUrl } from "@/lib/tenant-url";

const formSchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio"),
  lastName: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri"),
  companyName: z.string().min(2, "Il nome azienda è obbligatorio"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const trpc = useTRPC();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyName: "",
    },
  });

  const createTenant = useMutation(
    trpc.onboarding.createTenant.mutationOptions({
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      // Step 1: create user with Better-Auth
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`,
      });

      if (error) {
        toast.error(error.message ?? "Errore durante la registrazione");
        return;
      }

      // Step 2: create Tenant + Membership owner via tRPC
      const { tenant } = await createTenant.mutateAsync({
        companyName: values.companyName,
      });

      toast.success("Account creato! Reindirizzamento…");
      window.location.assign(getTenantDashboardUrl(tenant.slug));
    } catch {
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center mb-8 gap-2">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Target className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Coordinate</h1>
        <p className="text-muted-foreground text-sm font-medium">Business Management Platform</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Crea il tuo account</CardTitle>
          <CardDescription className="text-center">
            Crea il tuo workspace e inizia subito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mario"
                          className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rossi"
                          className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome azienda</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rossi Srl"
                        className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email aziendale</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="mario@rossisrl.it"
                        className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione account…
                  </>
                ) : (
                  "Crea account"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Accedi
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
