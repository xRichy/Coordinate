-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('todo', 'in_progress', 'done', 'delivered');

-- CreateTable work_orders
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contactId" TEXT,
    "contactName" TEXT NOT NULL,
    "quantity" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'todo',
    "notes" TEXT,
    "quoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_tenantId_number_key" ON "work_orders"("tenantId", "number");
CREATE INDEX "work_orders_tenantId_idx" ON "work_orders"("tenantId");
CREATE INDEX "work_orders_tenantId_status_idx" ON "work_orders"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "work_orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_orders_tenant_isolation ON "work_orders"
  USING ("tenantId" = current_setting('app.tenant_id', true));
