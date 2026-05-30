"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Target, Loader2, Building2 } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";
import { getTenantDashboardUrl } from "@/lib/tenant-url";
import type { AppRouter } from "@coordinate/api";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type TenantItem = RouterOutput["onboarding"]["getMyTenants"][number];

const formSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const trpcClient = useTRPCClient();

  const [step, setStep] = useState<"form" | "tenant-select" | "redirecting">("form");
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const checkedOnMount = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // After OAuth callback the browser lands here with an active session.
  // Check once on mount: if already authenticated, go straight to tenant redirect.
  useEffect(() => {
    if (checkedOnMount.current) return;
    checkedOnMount.current = true;
    authClient.getSession().then(({ data }) => {
      if (data?.user) handlePostLogin();
    });
    // handlePostLogin is defined below but stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePostLogin() {
    setIsLoading(true);
    try {
      const userTenants = await trpcClient.onboarding.getMyTenants.query();

      if (userTenants.length === 0) {
        window.location.assign("/signup");
        return;
      }

      if (userTenants.length === 1) {
        setStep("redirecting");
        window.location.assign(getTenantDashboardUrl(userTenants[0].slug));
        return;
      }

      setTenants(userTenants);
      setStep("tenant-select");
    } catch {
      toast.error("Impossibile recuperare i workspace. Riprova.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message ?? "Credenziali non valide");
        return;
      }

      await handlePostLogin();
    } catch {
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "microsoft") {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
      // Browser is redirected to the provider — no code runs after this.
    } catch {
      toast.error("Impossibile avviare il login con il provider esterno");
      setIsLoading(false);
    }
  }

  // ── Tenant selection (multi-org users) ────────────────────────────────────

  if (step === "tenant-select") {
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
            <CardTitle className="text-2xl font-bold text-center">Scegli workspace</CardTitle>
            <CardDescription className="text-center">
              Hai accesso a più workspace. Seleziona quello su cui lavorare.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  setStep("redirecting");
                  window.location.assign(getTenantDashboardUrl(tenant.slug));
                }}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground truncate">/t/{tenant.slug}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </>
    );
  }

  // ── Redirecting / initial session check ──────────────────────────────────

  if (step === "redirecting") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Target className="h-7 w-7 text-primary-foreground" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────

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
          <CardTitle className="text-2xl font-bold text-center">Bentornato</CardTitle>
          <CardDescription className="text-center">
            Accedi al tuo workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background/50 border-border/50 hover:bg-accent/50"
              disabled={isLoading}
              onClick={() => handleOAuth("google")}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continua con Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-background/50 border-border/50 hover:bg-accent/50"
              disabled={isLoading}
              onClick={() => handleOAuth("microsoft")}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              Continua con Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/50 px-2 text-muted-foreground backdrop-blur-sm">oppure</span>
            </div>
          </div>

          {/* Email + password form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accesso in corso…
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Non hai un account?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Registrati gratis
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
