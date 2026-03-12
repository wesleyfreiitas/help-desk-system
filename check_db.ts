import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const tickets = await prisma.ticket.findMany({
    select: { protocol: true, deletedAt: true, status: true, clientId: true }
  });
  console.log(JSON.stringify(tickets, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
