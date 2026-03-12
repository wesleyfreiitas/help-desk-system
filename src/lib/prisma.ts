import { PrismaClient } from '@prisma/client';

// Debug: Verificar se a variável existe no servidor
if (typeof window === 'undefined') {
  console.log('[Prisma Debug] DATABASE_URL exists:', !!process.env.DATABASE_URL);
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
