import { prisma } from "@coordinate/database";
import type { Tenant } from "@coordinate/database";

export async function resolveTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { slug } });
}
