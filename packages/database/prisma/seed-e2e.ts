/**
 * Deterministic seed for Playwright E2E tests. Idempotent (skip-if-exists), so
 * it can run before every test run without wiping data.
 *
 * Creates two tenants, each with an ADMIN user (not owner): admins are exempt
 * from the mandatory-2FA gate, so E2E can log in with plain email + password.
 *   /t/e2e-a  →  admin-a@e2e.local
 *   /t/e2e-b  →  admin-b@e2e.local
 * Both passwords: E2ePass123!
 *
 * Auth tables (User/Account) are global; tenant-scoped rows (Membership,
 * TenantSetting, PipelineStage) are written inside a tx that sets app.tenant_id
 * so Postgres RLS is satisfied.
 */
import { PrismaClient, TenantStatus, MemberRole } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

export const E2E_PASSWORD = "E2ePass123!";

const DEFAULT_SETTINGS = [
  { key: "timezone", value: "Europe/Rome" },
  { key: "locale", value: "it" },
  { key: "currency", value: "EUR" },
  { key: "dateFormat", value: "DD/MM/YYYY" },
];
const DEFAULT_STAGES = ["Nuovo", "Contattato", "Qualificato", "Proposta", "Vinto", "Perso"];

async function ensureTenant(slug: string, name: string, adminEmail: string, adminName: string) {
  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { slug, name, status: TenantStatus.active },
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant!.id}, true)`;
      await tx.tenantSetting.createMany({
        data: DEFAULT_SETTINGS.map((s) => ({ tenantId: tenant!.id, key: s.key, value: s.value })),
      });
      await tx.pipelineStage.createMany({
        data: DEFAULT_STAGES.map((stageName, i) => ({ tenantId: tenant!.id, name: stageName, order: i + 1 })),
      });
    });
  }

  // Admin user (global auth tables — no RLS).
  const user =
    (await prisma.user.findUnique({ where: { email: adminEmail } })) ??
    (await prisma.user.create({ data: { email: adminEmail, name: adminName, emailVerified: true } }));

  const hashed = await hashPassword(E2E_PASSWORD);
  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
    update: { password: hashed },
    create: { providerId: "credential", accountId: user.id, userId: user.id, password: hashed },
  });

  // Admin membership (RLS-scoped).
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant!.id}, true)`;
    const existing = await tx.membership.findFirst({ where: { userId: user.id, tenantId: tenant!.id } });
    if (!existing) {
      await tx.membership.create({
        data: { userId: user.id, tenantId: tenant!.id, role: MemberRole.admin },
      });
    }
  });

  console.log(`✓ E2E tenant /t/${slug} — admin ${adminEmail} / ${E2E_PASSWORD}`);
}

async function main() {
  await ensureTenant("e2e-a", "E2E Acme", "admin-a@e2e.local", "E2E Admin A");
  await ensureTenant("e2e-b", "E2E Beta", "admin-b@e2e.local", "E2E Admin B");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
