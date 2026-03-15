import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPrefix() {
  const tickets = await prisma.ticket.findMany({
    where: {
      protocol: {
        contains: 'TKT-'
      }
    }
  });

  console.log(`Encontrados ${tickets.length} tickets com prefixo.`);

  for (const ticket of tickets) {
    if (ticket.protocol) {
      const newProtocol = ticket.protocol.replace('TKT-', '');
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { protocol: newProtocol }
      });
      console.log(`Updated ${ticket.protocol} -> ${newProtocol}`);
    }
  }

  console.log('Finalizado.');
}

cleanPrefix()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
