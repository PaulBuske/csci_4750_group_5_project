// src/app/lib/db.ts
import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

export const dbSingleton = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = dbSingleton;
}