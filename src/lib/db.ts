import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
    // adapter if using driver adapters, but standard sqlite is fine
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
