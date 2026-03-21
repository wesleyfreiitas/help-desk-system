import { prisma } from './prisma';

export interface DistributionConfig {
  enabled: boolean;
  mode: 'SEQUENTIAL' | 'LEAST_ASSIGNED';
  attendantIds: string[];
  lastAssignedId?: string; // Para o modo SEQUENTIAL
}

export async function assignTicket(ticketId: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'ticket_distribution' }
  });

  if (!setting) return null;

  const config: DistributionConfig = JSON.parse(setting.value);
  if (!config.enabled || !config.attendantIds || config.attendantIds.length === 0) {
    return null;
  }

  let selectedAssigneeId: string | null = null;

  if (config.mode === 'SEQUENTIAL') {
    // Round-Robin
    const currentIdx = config.lastAssignedId 
      ? config.attendantIds.indexOf(config.lastAssignedId) 
      : -1;
    
    let nextIdx = currentIdx + 1;
    if (nextIdx >= config.attendantIds.length) {
      nextIdx = 0;
    }

    selectedAssigneeId = config.attendantIds[nextIdx];
    
    // Atualizar o ponteiro para o próximo
    await prisma.systemSetting.update({
      where: { key: 'ticket_distribution' },
      data: {
        value: JSON.stringify({ ...config, lastAssignedId: selectedAssigneeId })
      }
    });

  } else if (config.mode === 'LEAST_ASSIGNED') {
    // Menor Carga (Contar chamados abertos dos atendentes selecionados)
    // Otimizado: Usar groupBy para fazer tudo em uma única query
    const counts = await prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: {
        assigneeId: { in: config.attendantIds },
        status: { in: ['ABERTO', 'EM_ANDAMENTO', 'PENDENTE', 'AGUARDANDO_CLIENTE'] },
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    // Mapear os resultados e incluir atendentes com 0 chamados (que podem não aparecer no groupBy)
    const statsMap = new Map(counts.map(c => [c.assigneeId, c._count.id]));
    const fullStats = config.attendantIds.map(id => ({
      id,
      count: statsMap.get(id) || 0
    }));

    // Ordenar por quem tem menos e pegar o primeiro
    fullStats.sort((a, b) => a.count - b.count);
    selectedAssigneeId = fullStats[0].id;
  }

  if (selectedAssigneeId) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId: selectedAssigneeId }
    });
    return selectedAssigneeId;
  }

  return null;
}
