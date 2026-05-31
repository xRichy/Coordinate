-- AlterTable: add parentId for self-referential Persona → Azienda relation
ALTER TABLE "contacts" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "contacts_parentId_idx" ON "contacts"("parentId");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
