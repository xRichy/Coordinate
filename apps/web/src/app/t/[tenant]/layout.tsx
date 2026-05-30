import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MainLayout } from "@/components/layout/MainLayout";
import { resolveTenantBySlug } from "@coordinate/core/tenant";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantParam } = await params;

  // Prefer header set by middleware (T1.2); fall back to path param.
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug") ?? tenantParam;

  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <SidebarProvider>
      <MainLayout tenantSlug={slug}>{children}</MainLayout>
    </SidebarProvider>
  );
}
