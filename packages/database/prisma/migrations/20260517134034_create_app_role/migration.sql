-- Create a restricted app role that is subject to Row-Level Security.
--
-- PostgreSQL superusers (rolsuper = t) bypass RLS unconditionally even with
-- FORCE ROW LEVEL SECURITY. The 'coordinate' role is the cluster bootstrap
-- superuser and cannot be demoted. The fix is a two-role pattern:
--   coordinate      → superuser, used only by Prisma Migrate (DIRECT_URL)
--   coordinate_app  → regular user, used by the Prisma Client (DATABASE_URL)
--
-- coordinate_app has no SUPERUSER, no BYPASSRLS, so RLS policies on
-- Membership, TenantSetting, and AuditLog apply to all its queries.
--
-- Wrapped in DO/EXCEPTION so the migration is idempotent (safe to replay in
-- Prisma's shadow database, which shares the same Postgres cluster and would
-- otherwise fail with "role already exists" on the second run).

DO $$
BEGIN
  CREATE ROLE coordinate_app
    WITH LOGIN PASSWORD 'coordinate'
    NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT CONNECT ON DATABASE coordinate_dev TO coordinate_app;
GRANT USAGE ON SCHEMA public TO coordinate_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coordinate_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO coordinate_app;

-- Ensure tables created by future migrations are also accessible
ALTER DEFAULT PRIVILEGES FOR ROLE coordinate IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO coordinate_app;
ALTER DEFAULT PRIVILEGES FOR ROLE coordinate IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO coordinate_app;