-- File attachments (URLs from Vercel Blob)
ALTER TABLE "products" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "attachmentName" TEXT;
