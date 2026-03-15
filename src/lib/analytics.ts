import { prisma } from './prisma';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

export async function getDashboardStats(whereClause: any, dateRange: { from: Date; to: Date }) {
  const baseWhere = {
    ...whereClause,
    createdAt: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  };

  // 1. Métricas Básicas (Cards)
  const ticketsPeriod = await prisma.ticket.findMany({
    where: baseWhere,
    select: {
      id: true,
      createdAt: true,
      firstResponseAt: true,
      resolvedAt: true,
      slaResolveDate: true,
      status: true,
      priority: true,
      clientId: true,
      categoryId: true,
      productId: true,
      reopenedCount: true
    }
  });

  const createdCount = ticketsPeriod.length;
  const closedCount = ticketsPeriod.filter(t => ['RESOLVIDO', 'FECHADO'].includes(t.status || '')).length;
  // Abertos (Na mão da operação - ABERTO, EM_ANDAMENTO)
  const openCount = ticketsPeriod.filter(t => ['ABERTO', 'EM_ANDAMENTO'].includes(t.status || '')).length;
  // Pendentes (Congelados ou esperando ação - PENDENTE, AGUARDANDO_CLIENTE, AGUARDANDO_TERCEIRO)
  const pendingCount = ticketsPeriod.filter(t => ['PENDENTE', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_TERCEIRO'].includes(t.status || '')).length;

  // Cálculos de Tempo (MTTR e Primeira Resposta) em Horas
  let totalResolutionTime = 0;
  let resolvedWithTimeCount = 0;
  let totalFirstResponseTime = 0;
  let firstResponseWithTimeCount = 0;
  let slaCompliantCount = 0;

  ticketsPeriod.forEach(t => {
    if (t.resolvedAt && t.createdAt) {
      const diff = t.resolvedAt.getTime() - t.createdAt.getTime();
      totalResolutionTime += diff;
      resolvedWithTimeCount++;

      if (t.slaResolveDate && t.resolvedAt <= t.slaResolveDate) {
        slaCompliantCount++;
      }
    }
    if (t.firstResponseAt && t.createdAt) {
      const diff = t.firstResponseAt.getTime() - t.createdAt.getTime();
      totalFirstResponseTime += diff;
      firstResponseWithTimeCount++;
    }
  });

  const mttr = resolvedWithTimeCount > 0 ? (totalResolutionTime / resolvedWithTimeCount / (1000 * 60 * 60)).toFixed(1) : "0";
  const mfrr = firstResponseWithTimeCount > 0 ? (totalFirstResponseTime / firstResponseWithTimeCount / (1000 * 60 * 60)).toFixed(1) : "0";
  const slaCompliance = resolvedWithTimeCount > 0 ? ((slaCompliantCount / resolvedWithTimeCount) * 100).toFixed(1) : "0";

  // 2. Backlog (Saldo Final)
  // Backlog inicial = Tickets criados antes do período e ainda não fechados no início do período
  const initialBacklog = await prisma.ticket.count({
    where: {
      ...whereClause,
      createdAt: { lt: dateRange.from },
      OR: [
        { resolvedAt: null },
        { resolvedAt: { gte: dateRange.from } }
      ],
      status: { not: 'CANCELADO' }
    }
  });

  const finalBalance = initialBacklog + createdCount - closedCount;

  // 3. Top 10 Clientes, Categorias e Produtos
  const [topClients, topCategories, topProducts] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['clientId'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.ticket.groupBy({
      by: ['categoryId'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.ticket.groupBy({
      by: ['productId'],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
  ]);

  // Buscar nomes para os rankings (Prisma groupBy não traz relations)
  const clientNames = await prisma.client.findMany({
    where: { id: { in: topClients.map(c => c.clientId) } },
    select: { id: true, name: true }
  });
  const categoryNames = await prisma.category.findMany({
    where: { id: { in: topCategories.map(c => c.categoryId).filter(Boolean) as string[] } },
    select: { id: true, name: true }
  });
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProducts.map(p => p.productId).filter(Boolean) as string[] } },
    select: { id: true, name: true }
  });

  const rankedClients = topClients.map(c => ({
    name: clientNames.find(n => n.id === c.clientId)?.name || 'Desconhecido',
    count: c._count.id
  }));

  const rankedCategories = topCategories.map(c => ({
    name: categoryNames.find(n => n.id === c.categoryId)?.name || 'Sem Categoria',
    count: c._count.id
  }));

  const rankedProducts = topProducts.map(p => ({
    name: productNames.find(n => n.id === p.productId)?.name || 'Sem Produto',
    count: p._count.id
  }));

  // 3.5 Top 10 Empresas sem chamados por Produto (Ociosidade B2B)
  // Obter todos os clientes ativos e produtos ativos independetemente se têm ticket ou não
  const allActiveClients = await prisma.client.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
  const allActiveProducts = await prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });

  // Agrupar quantos tickets cada cliente abriu para cada produto neste período
  const ticketCountsByClientAndProduct = await prisma.ticket.groupBy({
    by: ['clientId', 'productId'],
    where: baseWhere,
    _count: { id: true }
  });

  const inactiveB2B: { clientName: string; productName: string; openTicketsTotal: number }[] = [];

  // Buscar todos os chamados abertos de cada cliente para o tooltip
  const openTicketsByClient = await prisma.ticket.groupBy({
    by: ['clientId'],
    where: { status: { in: ['ABERTO', 'EM_ANDAMENTO', 'PENDENTE', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_TERCEIRO'] } },
    _count: { id: true }
  });

  // Cross Join na memória para encontrar as combinações zeradas
  for (const client of allActiveClients) {
    const openCount = openTicketsByClient.find(o => o.clientId === client.id)?._count.id || 0;

    for (const product of allActiveProducts) {
      // Verifica se essa empresa abriu chamado para este produto
      const hasTickets = ticketCountsByClientAndProduct.find(
        (t) => t.clientId === client.id && t.productId === product.id
      );

      if (!hasTickets || hasTickets._count.id === 0) {
        inactiveB2B.push({ 
          clientName: client.name, 
          productName: product.name,
          openTicketsTotal: openCount
        });
      }
    }
  }

  // Ordenar alfabeticamente e pegar o Top 10
  const rankedInactiveB2B = inactiveB2B.sort((a, b) => a.clientName.localeCompare(b.clientName)).slice(0, 10);
  // 4. Series Temporais (Graficos de Linha)
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  const timeSeries = days.map(day => {
    const dayStr = format(day, 'dd/MM');
    const isoDay = format(day, 'yyyy-MM-dd');
    
    const dayTickets = ticketsPeriod.filter(t => format(t.createdAt, 'yyyy-MM-dd') === isoDay);
    const dayClosed = ticketsPeriod.filter(t => t.resolvedAt && format(t.resolvedAt, 'yyyy-MM-dd') === isoDay);
    
    // Media de espera no dia (em minutos)
    const waits = dayTickets.filter(t => t.firstResponseAt).map(t => (t.firstResponseAt!.getTime() - t.createdAt.getTime()) / (1000 * 60));
    const avgWait = waits.length > 0 ? (waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
    
    // Media de encerramento no dia (em minutos)
    const resolutions = dayClosed.map(t => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60));
    const avgResolution = resolutions.length > 0 ? (resolutions.reduce((a, b) => a + b, 0) / resolutions.length) : 0;

    return { 
      name: dayStr, 
      abertos: dayTickets.length, 
      fechados: dayClosed.length,
      espera: Math.round(avgWait),
      encerramento: Math.round(avgResolution)
    };
  });

  // 5. Distribuição por Horário (Heatmap data - Matriz 24x7)
  const heatmapData = Array.from({ length: 7 }, (_, dayIndex) => {
    return Array.from({ length: 24 }, (_, hourIndex) => ({
      day: dayIndex,
      hour: hourIndex,
      count: 0
    }));
  });
  
  ticketsPeriod.forEach(t => {
    const hour = t.createdAt.getHours();
    const day = t.createdAt.getDay(); // 0 (Dom) a 6 (Sab)
    heatmapData[day][hour].count++;
  });

  // Flatten heatmap para facilitar renderização
  const flatHeatmap = heatmapData.flat();

  const reopenedTotal = ticketsPeriod.reduce((acc, t) => acc + (t.reopenedCount || 0), 0);

  return {
    metrics: { mttr, mfrr, slaCompliance, createdCount, openCount, pendingCount, closedCount, reopenedTotal },
    backlog: { initial: initialBacklog, opened: createdCount, closed: closedCount, final: finalBalance },
    rankings: { clients: rankedClients, categories: rankedCategories, products: rankedProducts, inactiveB2B: rankedInactiveB2B },
    timeSeries,
    distribution: { heatmap: flatHeatmap }
  };
}
