import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");

  // On a tenant subdomain → go to dashboard
  if (tenantSlug) {
    redirect("/dashboard");
  }

  // On root domain (no tenant) → landing placeholder
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Coordinate</h1>
      <p className="text-muted-foreground text-lg">
        Il CRM pensato per le PMI italiane.
      </p>
      <a
        href="/login"
        className="rounded-md bg-primary px-6 py-2 text-primary-foreground font-medium hover:opacity-90"
      >
        Accedi
      </a>
    </main>
  );
}
