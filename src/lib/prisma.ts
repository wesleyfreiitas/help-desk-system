import { PrismaClient } from '../../prisma/generated-client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Forçamos a criação de uma nova instância e passamos a URL explicitamente
// Isso resolve o erro de "Environment variable not found" na Vercel
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
