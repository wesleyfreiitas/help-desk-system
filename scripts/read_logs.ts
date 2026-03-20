import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if table exists
    const tables: any = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables:', tables.map((t: any) => t.tablename));

    const count: any = await prisma.$queryRaw`SELECT count(*) FROM "ExternalApiLog"`;
    console.log('Log count:', count);

    const logs: any = await prisma.$queryRaw`SELECT * FROM "ExternalApiLog" ORDER BY "createdAt" DESC LIMIT 5`;
    console.log('Logs:', JSON.stringify(logs, null, 2));
  } catch (err: any) {
    console.error('Error in script:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
