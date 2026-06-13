-- Add "customer" value to ContactStatus enum
ALTER TYPE "ContactStatus" ADD VALUE 'customer';

-- CreateEnum DealStatus
CREATE TYPE "DealStatus" AS ENUM ('open', 'won', 'lost');

-- AlterTable deals: add status, contactId
ALTER TABLE "deals"
  ADD COLUMN "status" "DealStatus" NOT NULL DEFAULT 'open',
  ADD COLUMN "contactId" TEXT;

-- CreateIndex
CREATE INDEX "deals_tenantId_status_idx" ON "deals"("tenantId", "status");

-- AddForeignKey deals.contactId → contacts
ALTER TABLE "deals" ADD CONSTRAINT "deals_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
