-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');

-- CreateTable pipeline_stages
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_stages_tenantId_idx" ON "pipeline_stages"("tenantId");
CREATE INDEX "pipeline_stages_tenantId_order_idx" ON "pipeline_stages"("tenantId", "order");

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "pipeline_stages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY pipeline_stages_tenant_isolation ON "pipeline_stages"
  USING ("tenantId" = current_setting('app.tenant_id', true));

-- CreateTable leads
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "contactName" TEXT,
    "stageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");
CREATE INDEX "leads_tenantId_status_idx" ON "leads"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_tenant_isolation ON "leads"
  USING ("tenantId" = current_setting('app.tenant_id', true));

-- CreateTable deals
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_tenantId_idx" ON "deals"("tenantId");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_tenant_isolation ON "deals"
  USING ("tenantId" = current_setting('app.tenant_id', true));
