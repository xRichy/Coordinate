-- AlterTable contacts: add ownerId
ALTER TABLE "contacts" ADD COLUMN "ownerId" TEXT;

CREATE INDEX "contacts_ownerId_idx" ON "contacts"("ownerId");

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable tags
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_tenantId_name_key" ON "tags"("tenantId", "name");
CREATE INDEX "tags_tenantId_idx" ON "tags"("tenantId");

ALTER TABLE "tags" ADD CONSTRAINT "tags_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS on tags
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_tenant_isolation ON "tags"
  USING ("tenantId" = current_setting('app.tenant_id', true));

-- CreateTable contact_tags (junction — no tenantId, access via parent entities)
CREATE TABLE "contact_tags" (
    "contactId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("contactId", "tagId")
);

ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "tags"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
