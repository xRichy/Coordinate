import { headers } from "next/headers";
import { resolveTenantBySlug } from "@coordinate/core/tenant";

export async function GET() {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");

  if (!slug) {
    return Response.json(
      { error: "No x-tenant-slug header — are you on a tenant subdomain?" },
      { status: 400 }
    );
  }

  const tenant = await resolveTenantBySlug(slug);

  if (!tenant) {
    return Response.json(
      { error: `Tenant not found: ${slug}` },
      { status: 404 }
    );
  }

  return Response.json({
    "x-tenant-slug": slug,
    "x-tenant-id": tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
  });
}
