import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const lastCheck = searchParams.get('since');
  
  if (!lastCheck) return NextResponse.json({ events: [] });

  const sinceDate = new Date(lastCheck);
  const user = session.user;

  // Filtro de visibilidade (mesma lógica das páginas)
  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(user.role);
  
  const orgSetting = await prisma.systemSetting.findUnique({ where: { key: 'organization_rules' } });
  const orgRules = orgSetting ? JSON.parse(orgSetting.value) : { managersCanViewAll: true, membersCanViewOthers: true };

  const whereClause: any = {
    deletedAt: null,
    OR: [
      { createdAt: { gt: sinceDate } },
      { 
        AND: [
          { updatedAt: { gt: sinceDate } },
          { reopenedCount: { gt: 0 } }
        ]
      }
    ]
  };

  if (isOrgUser) {
    whereClause.clientId = user.clientId;
    
    let canViewAll = true;
    if (user.role === 'ORG_MANAGER' && !orgRules.managersCanViewAll) canViewAll = false;
    if (user.role === 'ORG_MEMBER' && !orgRules.membersCanViewOthers) canViewAll = false;
    if (user.role === 'CLIENT') canViewAll = false;

    if (!canViewAll) {
      whereClause.requesterId = user.id;
    }
  }

  const recentTickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      protocol: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      reopenedCount: true
    }
  });

  // Mapear eventos
  const events = recentTickets.map(t => {
    const isNew = t.createdAt > sinceDate;
    // Consideramos reaberto se houve update após sinceDate e tem contagem de reabertura
    // Para simplificar, se não for "novo", assumimos que o evento de interesse foi a reabertura
    const type = isNew ? 'NEW_TICKET' : 'TICKET_REOPENED';
    
    return {
      id: `${t.id}-${type}`,
      ticketId: t.id,
      protocol: t.protocol,
      title: t.title,
      type
    };
  });

  return NextResponse.json({ events });
}
