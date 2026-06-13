-- AlterTable contacts: add deletedAt for soft delete
ALTER TABLE "contacts" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "contacts_tenantId_deletedAt_idx" ON "contacts"("tenantId", "deletedAt");
