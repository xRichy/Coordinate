-- Seat limit per tenant: number of accounts included (default owner + 1).
-- Extra seats are unlocked manually from the super-admin section after payment.
ALTER TABLE "Tenant" ADD COLUMN "maxSeats" INTEGER NOT NULL DEFAULT 2;
