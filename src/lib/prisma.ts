import { PrismaClient } from '@prisma/client';

// Debug: Verificar se a variável existe no servidor e qual o seu formato básico
if (typeof window === 'undefined') {
  const url = process.env.DATABASE_URL || '';
  const masked = url ? url.replace(/:([^@]+)@/, ':****@') : 'MISSING';
  console.log('[Prisma Debug] DATABASE_URL Check:', {
    exists: !!url,
    startsWithPostgres: url.startsWith('postgresql://'),
    preview: masked,
    nodeEnv: process.env.NODE_ENV
  });
}

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    console.error('[Prisma Error] DATABASE_URL is not defined in process.env');
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
