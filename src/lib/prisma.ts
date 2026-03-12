import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  let databaseUrl = process.env.DATABASE_URL || '';
  
  // Solução para o erro "prepared statement already exists":
  // Quando usamos o Pooler do Supabase (porta 6543), o Prisma NÃO pode usar prepared statements.
  // Adicionamos ?pgbouncer=true se ele não estiver lá.
  if (databaseUrl.includes(':6543') && !databaseUrl.includes('pgbouncer=true')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1`;
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
