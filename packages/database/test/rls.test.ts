/**
 * RLS isolation tests for Membership, TenantSetting, AuditLog.
 *
 * Two PrismaClient instances are used:
 *   superClient  → connects as the `coordinate` superuser (DIRECT_URL),
 *                  bypasses RLS — used for test setup/teardown only.
 *   appClient    → connects as `coordinate_app` (DATABASE_URL),
 *                  subject to RLS — used for the actual assertions.
 *
 * Pattern:
 *   1. superClient creates isolated tenant fixtures (unique slugs with timestamp).
 *   2. appClient queries without / with wrong / with correct tenant context.
 *   3. superClient deletes fixtures in afterAll.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, TenantPlan, TenantStatus, MemberRole } from "../src/generated/prisma";

const superClient = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

const appClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const stamp = Date.now();

describe("RLS: tenant isolation on RLS-protected tables", () => {
  let tenantAId: string;
  let tenantBId: string;
  let userId: string;

  // ── Setup ─────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    // superClient bypasses RLS — create fixture data directly.

    const tenantA = await superClient.tenant.create({
      data: {
        slug: `test-rls-a-${stamp}`,
        name: "RLS Test Tenant A",
        plan: TenantPlan.starter,
        status: TenantStatus.active,
      },
    });
    tenantAId = tenantA.id;

    const tenantB = await superClient.tenant.create({
      data: {
        slug: `test-rls-b-${stamp}`,
        name: "RLS Test Tenant B",
        plan: TenantPlan.starter,
        status: TenantStatus.active,
      },
    });
    tenantBId = tenantB.id;

    const user = await superClient.user.create({
      data: {
        email: `test-rls-${stamp}@test.local`,
        name: "RLS Test User",
      },
    });
    userId = user.id;

    // Populate all three RLS-protected tables for tenantA.
    // superClient (superuser) can write without setting app.tenant_id.
    await superClient.membership.create({
      data: { userId, tenantId: tenantAId, role: MemberRole.owner },
    });

    await superClient.tenantSetting.create({
      data: { tenantId: tenantAId, key: "rls-test-key", value: "rls-test-value" },
    });

    await superClient.auditLog.create({
      data: {
        tenantId: tenantAId,
        userId,
        action: "rls.test",
        entityType: "Test",
        entityId: tenantAId,
        diff: { test: true },
      },
    });
  });

  // ── Teardown ───────────────────────────────────────────────────────────────

  afterAll(async () => {
    await superClient.auditLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await superClient.tenantSetting.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await superClient.membership.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await superClient.user.delete({ where: { id: userId } });
    await superClient.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await superClient.$disconnect();
    await appClient.$disconnect();
  });

  // ── Membership ────────────────────────────────────────────────────────────

  describe("Membership", () => {
    it("returns 0 rows without tenant context", async () => {
      const count = await appClient.membership.count();
      expect(count).toBe(0);
    });

    it("returns 0 rows with wrong tenant context", async () => {
      const count = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantBId}, true)`;
        return tx.membership.count();
      });
      expect(count).toBe(0);
    });

    it("returns rows with correct tenant context", async () => {
      const count = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantAId}, true)`;
        return tx.membership.count();
      });
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  // ── TenantSetting ─────────────────────────────────────────────────────────

  describe("TenantSetting", () => {
    it("returns 0 rows without tenant context", async () => {
      const count = await appClient.tenantSetting.count();
      expect(count).toBe(0);
    });

    it("returns 0 rows with wrong tenant context", async () => {
      const count = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantBId}, true)`;
        return tx.tenantSetting.count();
      });
      expect(count).toBe(0);
    });

    it("returns rows with correct tenant context", async () => {
      const rows = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantAId}, true)`;
        return tx.tenantSetting.findMany({ where: { key: "rls-test-key" } });
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].value).toBe("rls-test-value");
    });
  });

  // ── AuditLog ──────────────────────────────────────────────────────────────

  describe("AuditLog", () => {
    it("returns 0 rows without tenant context", async () => {
      const count = await appClient.auditLog.count();
      expect(count).toBe(0);
    });

    it("returns 0 rows with wrong tenant context", async () => {
      const count = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantBId}, true)`;
        return tx.auditLog.count();
      });
      expect(count).toBe(0);
    });

    it("returns rows with correct tenant context", async () => {
      const count = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantAId}, true)`;
        return tx.auditLog.count({ where: { action: "rls.test" } });
      });
      expect(count).toBe(1);
    });
  });

  // ── Membership check (mirrors tenantProcedure guard) ─────────────────────

  describe("cross-tenant membership check via superClient (mirrors tenantProcedure)", () => {
    it("user has membership for tenant A", async () => {
      const m = await superClient.membership.findFirst({
        where: { userId, tenantId: tenantAId },
      });
      expect(m).not.toBeNull();
    });

    it("user has no membership for tenant B — tenantProcedure would throw FORBIDDEN", async () => {
      const m = await superClient.membership.findFirst({
        where: { userId, tenantId: tenantBId },
      });
      expect(m).toBeNull();
    });
  });

  // ── Context isolation between transactions ────────────────────────────────

  describe("tenant context isolation between transactions", () => {
    it("context from previous transaction does not leak into next", async () => {
      // First transaction sets tenantA context
      await appClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantAId}, true)`;
        await tx.auditLog.count();
      });

      // Second query has no context set → must return 0
      const count = await appClient.auditLog.count();
      expect(count).toBe(0);
    });
  });
});
