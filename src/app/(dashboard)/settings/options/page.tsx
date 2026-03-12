import { prisma } from '@/lib/prisma';
import OptionsClient from './OptionsClient';

export default async function OptionsPage() {
  const options = (await prisma.$queryRaw`SELECT * FROM TicketOption ORDER BY "order" ASC`) as any[];

  return <OptionsClient initialOptions={options} />;
}
