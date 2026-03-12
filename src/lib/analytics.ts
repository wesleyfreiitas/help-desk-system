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
  const pendingCount = ticketsPeriod.filter(t => !['RESOLVIDO', 'FECHADO', 'CANCELADO'].includes(t.status || '')).length;

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
    metrics: { mttr, mfrr, slaCompliance, createdCount, pendingCount, closedCount, reopenedTotal },
    backlog: { initial: initialBacklog, opened: createdCount, closed: closedCount, final: finalBalance },
    rankings: { clients: rankedClients, categories: rankedCategories, products: rankedProducts },
    timeSeries,
    distribution: { heatmap: flatHeatmap }
  };
}
