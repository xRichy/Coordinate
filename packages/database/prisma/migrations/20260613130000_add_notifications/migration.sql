-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('activity_reminder', 'deal_won');

-- CreateTable notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tenantId_recipientId_dedupeKey_key" ON "notifications"("tenantId", "recipientId", "dedupeKey");
CREATE INDEX "notifications_tenantId_recipientId_readAt_idx" ON "notifications"("tenantId", "recipientId", "readAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_tenant_isolation ON "notifications"
  USING ("tenantId" = current_setting('app.tenant_id', true));
