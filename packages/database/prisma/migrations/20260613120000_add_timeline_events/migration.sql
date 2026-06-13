-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('lead_stage_changed', 'lead_converted', 'deal_created', 'deal_status_changed');

-- AlterTable activities: link to contact / deal
ALTER TABLE "activities"
  ADD COLUMN "contactId" TEXT,
  ADD COLUMN "dealId" TEXT;

-- CreateIndex
CREATE INDEX "activities_tenantId_contactId_idx" ON "activities"("tenantId", "contactId");
CREATE INDEX "activities_tenantId_dealId_idx" ON "activities"("tenantId", "dealId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable timeline_events
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_tenantId_contactId_idx" ON "timeline_events"("tenantId", "contactId");
CREATE INDEX "timeline_events_tenantId_dealId_idx" ON "timeline_events"("tenantId", "dealId");
CREATE INDEX "timeline_events_tenantId_leadId_idx" ON "timeline_events"("tenantId", "leadId");

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "timeline_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY timeline_events_tenant_isolation ON "timeline_events"
  USING ("tenantId" = current_setting('app.tenant_id', true));
