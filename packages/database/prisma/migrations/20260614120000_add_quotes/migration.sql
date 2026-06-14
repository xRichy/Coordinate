-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- CreateTable quotes
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "contactId" TEXT,
    "contactName" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable quote_lines
CREATE TABLE "quote_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenantId_number_key" ON "quotes"("tenantId", "number");
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX "quotes_tenantId_status_idx" ON "quotes"("tenantId", "status");
CREATE INDEX "quote_lines_tenantId_idx" ON "quote_lines"("tenantId");
CREATE INDEX "quote_lines_quoteId_idx" ON "quote_lines"("quoteId");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_tenant_isolation ON "quotes"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "quote_lines" ENABLE ROW LEVEL SECURITY;
CREATE POLICY quote_lines_tenant_isolation ON "quote_lines"
  USING ("tenantId" = current_setting('app.tenant_id', true));
