-- Product cost price (for margin = price - costPrice)
ALTER TABLE "products" ADD COLUMN "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('ebay', 'amazon', 'vinted', 'subito', 'store', 'other');

-- CreateTable sales
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "channel" "SalesChannel" NOT NULL DEFAULT 'other',
    "buyer" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_tenantId_idx" ON "sales"("tenantId");
CREATE INDEX "sales_tenantId_soldAt_idx" ON "sales"("tenantId", "soldAt");
CREATE INDEX "sales_productId_idx" ON "sales"("productId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_tenant_isolation ON "sales"
  USING ("tenantId" = current_setting('app.tenant_id', true));
