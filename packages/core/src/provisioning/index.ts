import {
  prisma,
  withTenant,
  TenantPlan,
  TenantStatus,
  MemberRole,
  type Tenant,
  type User,
} from "@coordinate/database";
import { hashPassword, generateTempPassword } from "../auth/password";

/**
 * Provision a turnkey tenant: Tenant + owner User + credential Account +
 * owner Membership + default TenantSettings + default PipelineStages.
 *
 * Canonical provisioning logic, shared by the super-admin section (T4.18).
 * The standalone CLI `packages/database/prisma/provision-tenant.ts` (T4.17)
 * mirrors this — keep the two in sync (it lives in `database`, which cannot
 * import `core`, hence the duplication).
 */

const DEFAULT_SETTINGS = [
  { key: "timezone", value: "Europe/Rome" },
  { key: "locale", value: "it" },
  { key: "currency", value: "EUR" },
  { key: "dateFormat", value: "DD/MM/YYYY" },
];

const DEFAULT_STAGES = ["Nuovo", "Contattato", "Qualificato", "Proposta", "Vinto", "Perso"];

export interface ProvisionTenantInput {
  slug: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  plan?: TenantPlan;
  enabledModules?: string[];
  maxSeats?: number;
  /** When omitted (and the owner is a new user) a temporary password is generated. */
  password?: string;
}

export interface ProvisionTenantResult {
  tenant: Tenant;
  owner: User;
  /** The generated password to hand over, or null when a password was provided / the user already existed. */
  generatedPassword: string | null;
}

export async function provisionTenant(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
  const slug = input.slug.trim().toLowerCase();
  const email = input.ownerEmail.trim().toLowerCase();

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    throw new Error(`Esiste già un tenant con slug "${slug}".`);
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: input.name.trim(),
      plan: input.plan ?? TenantPlan.starter,
      status: TenantStatus.active,
      ...(input.enabledModules ? { enabledModules: input.enabledModules } : {}),
      ...(input.maxSeats != null ? { maxSeats: input.maxSeats } : {}),
    },
  });

  // Reuse an existing user (same person, second tenant); otherwise create one.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const owner =
    existingUser ??
    (await prisma.user.create({
      data: { email, name: input.ownerName.trim(), emailVerified: true },
    }));

  // Set credentials for a new user, or when a password was explicitly provided.
  let generatedPassword: string | null = null;
  if (!existingUser || input.password) {
    generatedPassword = input.password ? null : generateTempPassword();
    const hashed = await hashPassword(input.password ?? generatedPassword!);
    await prisma.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: owner.id } },
      update: { password: hashed },
      create: { providerId: "credential", accountId: owner.id, userId: owner.id, password: hashed },
    });
  }

  // Tenant-scoped rows inside withTenant so RLS (app.tenant_id) is satisfied.
  // Batched into createMany (1 round-trip each) to minimise latency on a remote
  // DB — sequential per-row inserts here were slow / could time out on Neon.
  await withTenant(tenant.id, async (db) => {
    await db.membership.create({
      data: { userId: owner.id, tenantId: tenant.id, role: MemberRole.owner },
    });
    await db.tenantSetting.createMany({
      data: DEFAULT_SETTINGS.map((s) => ({ tenantId: tenant.id, key: s.key, value: s.value })),
    });
    await db.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((name, i) => ({ tenantId: tenant.id, name, order: i + 1 })),
    });
  });

  return { tenant, owner, generatedPassword };
}
