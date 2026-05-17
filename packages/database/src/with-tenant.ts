import { prisma } from "./client";
import type { Prisma } from "./generated/prisma";

/**
 * Run a Prisma callback within a tenant-scoped transaction.
 *
 * Sets the Postgres session variable `app.tenant_id` via SET LOCAL so that
 * the RLS policies on Membership, TenantSetting, and AuditLog filter rows
 * to the specified tenant for the duration of the transaction.
 *
 * Usage:
 *   const memberships = await withTenant(tenantId, (tx) =>
 *     tx.membership.findMany()
 *   );
 */
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return callback(tx);
  });
}
