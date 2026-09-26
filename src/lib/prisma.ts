import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Vercel serverless instances can be created frequently, and Neon has connection limits.
// Reusing the client in development avoids opening a new database connection per reload.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;