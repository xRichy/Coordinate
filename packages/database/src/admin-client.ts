import { PrismaClient } from "./generated/prisma";

// Connects as the superuser role (DIRECT_URL = coordinate user), which bypasses
// Row-Level Security. Use ONLY for cross-tenant admin queries (e.g. listing all
// tenants a user belongs to during login). Never use in tenant-scoped paths.
const globalForPrismaAdmin = globalThis as unknown as { prismaAdmin: PrismaClient };

export const prismaAdmin =
  globalForPrismaAdmin.prismaAdmin ??
  new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrismaAdmin.prismaAdmin = prismaAdmin;
