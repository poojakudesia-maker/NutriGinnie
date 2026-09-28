import { PrismaClient } from "@prisma/client";

// Prevent hot-reload in dev from spawning a new PrismaClient (and exhausting
// Postgres connections) on every file change / route invocation.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
