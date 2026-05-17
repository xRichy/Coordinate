-- Enable Row-Level Security on all multi-tenant tables.
--
-- Tables in scope: Membership, TenantSetting, AuditLog
-- (tables that carry a "tenantId" column linking rows to a specific tenant)
--
-- FORCE ROW LEVEL SECURITY ensures the policy applies even to the table owner
-- (the `coordinate` DB user), which is required for isolation in single-user setups.
--
-- Policy logic:
--   current_setting('app.tenant_id', true)
--     - returns the session variable set by withTenant() via SET LOCAL
--     - returns NULL (not an error) when the variable has never been set
--     - NULL = "tenantId" evaluates to NULL (falsy) -> no rows visible -> safe default
--
-- Column names are camelCase ("tenantId") matching Prisma's output.
-- IDs are cuid strings, not UUIDs.

-- Membership
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Membership"
  USING      ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- TenantSetting
ALTER TABLE "TenantSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSetting" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "TenantSetting"
  USING      ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "AuditLog"
  USING      ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
