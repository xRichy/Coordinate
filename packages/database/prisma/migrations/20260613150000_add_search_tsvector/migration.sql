-- Global full-text search: a `searchable` tsvector column per entity, kept in
-- sync by BEFORE INSERT/UPDATE triggers, with a GIN index for fast @@ queries.
-- Config 'simple' = lowercase + tokenize, no stemming (robust for names, SKUs,
-- emails). Tenant isolation is handled by the existing RLS policies.

-- ── contacts ──────────────────────────────────────────────────────────────────
ALTER TABLE "contacts" ADD COLUMN "searchable" tsvector;

CREATE OR REPLACE FUNCTION contacts_searchable_update() RETURNS trigger AS $$
BEGIN
  NEW."searchable" := to_tsvector('simple',
    coalesce(NEW."name", '') || ' ' ||
    coalesce(NEW."email", '') || ' ' ||
    coalesce(NEW."company", '') || ' ' ||
    coalesce(NEW."phone", ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_searchable_trigger
  BEFORE INSERT OR UPDATE ON "contacts"
  FOR EACH ROW EXECUTE FUNCTION contacts_searchable_update();

CREATE INDEX "contacts_searchable_idx" ON "contacts" USING GIN ("searchable");

UPDATE "contacts" SET "searchable" = to_tsvector('simple',
  coalesce("name", '') || ' ' || coalesce("email", '') || ' ' ||
  coalesce("company", '') || ' ' || coalesce("phone", ''));

-- ── deals ─────────────────────────────────────────────────────────────────────
ALTER TABLE "deals" ADD COLUMN "searchable" tsvector;

CREATE OR REPLACE FUNCTION deals_searchable_update() RETURNS trigger AS $$
BEGIN
  NEW."searchable" := to_tsvector('simple', coalesce(NEW."title", ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_searchable_trigger
  BEFORE INSERT OR UPDATE ON "deals"
  FOR EACH ROW EXECUTE FUNCTION deals_searchable_update();

CREATE INDEX "deals_searchable_idx" ON "deals" USING GIN ("searchable");

UPDATE "deals" SET "searchable" = to_tsvector('simple', coalesce("title", ''));

-- ── products ──────────────────────────────────────────────────────────────────
ALTER TABLE "products" ADD COLUMN "searchable" tsvector;

CREATE OR REPLACE FUNCTION products_searchable_update() RETURNS trigger AS $$
BEGIN
  NEW."searchable" := to_tsvector('simple',
    coalesce(NEW."sku", '') || ' ' ||
    coalesce(NEW."name", '') || ' ' ||
    coalesce(NEW."category", ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_searchable_trigger
  BEFORE INSERT OR UPDATE ON "products"
  FOR EACH ROW EXECUTE FUNCTION products_searchable_update();

CREATE INDEX "products_searchable_idx" ON "products" USING GIN ("searchable");

UPDATE "products" SET "searchable" = to_tsvector('simple',
  coalesce("sku", '') || ' ' || coalesce("name", '') || ' ' || coalesce("category", ''));
