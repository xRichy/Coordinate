import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth, isSuperAdmin } from "@coordinate/core/auth";

/**
 * Server-side guard for the platform super-admin section. First layer of
 * defense (the API's `superAdminProcedure` is the second): no session → login,
 * logged-in-but-not-allowlisted → 404 (don't reveal the section exists).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if (!isSuperAdmin(session.user.email)) notFound();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/40 bg-background/80 px-4 md:px-8 backdrop-blur-md">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="font-semibold">Coordinate</span>
        <span className="text-muted-foreground">· Super-admin</span>
        <span className="ml-auto text-sm text-muted-foreground truncate">{session.user.email}</span>
      </header>
      <main className="mx-auto max-w-5xl p-4 md:p-8">{children}</main>
    </div>
  );
}
