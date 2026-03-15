import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allTickets = await prisma.ticket.findMany();
    let updated = 0;
    
    for (const ticket of allTickets) {
      if (ticket.protocol && ticket.protocol.includes('TKT-')) {
        const newProtocol = ticket.protocol.replace('TKT-', '');
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { protocol: newProtocol }
        });
        updated++;
      }
    }
    
    return NextResponse.json({ success: true, message: `Migração concluída! Foram limpos ${updated} chamados que continham TKT-. Pode fechar esta tela.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
