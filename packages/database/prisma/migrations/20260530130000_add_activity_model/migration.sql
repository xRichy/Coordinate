-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('task', 'call', 'meeting', 'note');

-- CreateEnum
CREATE TYPE "ActivityPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('todo', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL DEFAULT 'task',
    "title" TEXT NOT NULL,
    "priority" "ActivityPriority" NOT NULL DEFAULT 'medium',
    "status" "ActivityStatus" NOT NULL DEFAULT 'todo',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_tenantId_idx" ON "activities"("tenantId");
CREATE INDEX "activities_tenantId_status_idx" ON "activities"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant isolation
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY activities_tenant_isolation ON "activities"
  USING ("tenantId" = current_setting('app.tenant_id', true));
