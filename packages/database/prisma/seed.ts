import { PrismaClient, TenantPlan, TenantStatus, MemberRole } from "../src/generated/prisma";
import type { Prisma } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Company S.r.l.",
      plan: TenantPlan.pro,
      status: TenantStatus.active,
    },
  });
  console.log(`✓ Tenant: ${tenant.slug} (${tenant.plan})`);

  // Skeleton user — password auth fields added by Better-Auth in T1.4
  const user = await prisma.user.upsert({
    where: { email: "demo@coordinate.app" },
    update: {},
    create: {
      email: "demo@coordinate.app",
      name: "Demo Owner",
    },
  });
  console.log(`✓ User: ${user.email}`);

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: MemberRole.owner,
    },
  });
  console.log("✓ Membership: owner");

  const defaultSettings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
    { key: "timezone", value: "Europe/Rome" },
    { key: "locale", value: "it" },
    { key: "currency", value: "EUR" },
    { key: "dateFormat", value: "DD/MM/YYYY" },
  ];
  for (const s of defaultSettings) {
    await prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: s.key } },
      update: {},
      create: { tenantId: tenant.id, key: s.key, value: s.value },
    });
  }
  console.log(`✓ TenantSettings: ${defaultSettings.map((s) => s.key).join(", ")}`);

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: "tenant.created",
      entityType: "Tenant",
      entityId: tenant.id,
      diff: { slug: tenant.slug, plan: tenant.plan },
    },
  });
  console.log("✓ AuditLog: tenant.created");

  // Module seed data (Contact, Lead, Activity, Product, StockMovement)
  // will be added in T2.x when module schemas are defined.

  console.log("\nSeed complete.");
  console.log(`  Tenant:  ${tenant.slug}.lvh.me:3000`);
  console.log(`  User:    ${user.email}  (password auth: pending T1.4)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
