-- Remove BYPASSRLS privilege from the app role so that FORCE ROW LEVEL SECURITY
-- on Membership, TenantSetting, and AuditLog actually applies to app queries.
--
-- Without this, PostgreSQL superusers (rolbypassrls = t) silently skip all RLS
-- policies even when FORCE ROW LEVEL SECURITY is set on the table. The role
-- keeps all other superuser attributes; only the RLS bypass is revoked.
ALTER ROLE coordinate NOBYPASSRLS;