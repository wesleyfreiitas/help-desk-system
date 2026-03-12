import { PrismaClient } from '../../prisma/generated-client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Forçamos a criação de uma nova instância para pegar o novo schema
export const prisma = new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
