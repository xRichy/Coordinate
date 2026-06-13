-- AlterTable products: per-product low-stock threshold
ALTER TABLE "products" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
