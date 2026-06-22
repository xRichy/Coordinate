"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Target, Loader2, Building2, ShieldCheck } from "lucide-react";

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
import { Label } from "@/components/ui/label";
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

  const [step, setStep] = useState<"form" | "two-factor" | "tenant-select" | "redirecting">("form");
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const checkedOnMount = useRef(false);

  // Two-factor challenge state
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // If the user already has an active session, skip straight to tenant redirect.
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
        // No self-serve signup: every account belongs to a tenant created by the
        // operator. An account with no membership is orphaned — sign out and ask
        // them to contact the administrator rather than offering registration.
        await authClient.signOut();
        setStep("form");
        toast.error("Il tuo account non è associato a nessuna azienda. Contatta l'amministratore.");
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
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message ?? "Credenziali non valide");
        return;
      }

      // 2FA-enabled accounts don't get a session yet — they must pass the TOTP
      // challenge first.
      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        setCode("");
        setUseBackup(false);
        setStep("two-factor");
        return;
      }

      await handlePostLogin();
    } catch {
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.trim() });

      if (error) {
        toast.error(error.message ?? "Codice non valido. Riprova.");
        return;
      }

      await handlePostLogin();
    } catch {
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Two-factor challenge ──────────────────────────────────────────────────

  if (step === "two-factor") {
    return (
      <>
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Coordinate</h1>
          <p className="text-muted-foreground text-sm font-medium">Business Management Platform</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Verifica in due passaggi</CardTitle>
            <CardDescription className="text-center">
              {useBackup
                ? "Inserisci uno dei tuoi codici di backup."
                : "Inserisci il codice a 6 cifre dalla tua app authenticator."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onVerify2FA} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="2fa-code">{useBackup ? "Codice di backup" : "Codice"}</Label>
                <Input
                  id="2fa-code"
                  inputMode={useBackup ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder={useBackup ? "xxxxxxxx" : "000000"}
                  className="bg-background/50 border-border/50 focus-visible:ring-primary/50 text-center tracking-widest"
                  value={code}
                  onChange={(e) =>
                    setCode(useBackup ? e.target.value.trim() : e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica…
                  </>
                ) : (
                  "Verifica e accedi"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setUseBackup((v) => !v); setCode(""); }}
                >
                  {useBackup ? "Usa l'app authenticator" : "Usa un codice di backup"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setStep("form"); setCode(""); setUseBackup(false); }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </>
    );
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
