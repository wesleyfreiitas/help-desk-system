import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, parseISO, format } from 'date-fns';
import { Calendar, Building2, TrendingUp, UserCheck, Clock } from 'lucide-react';

export default async function ClientsReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 90));

  // Busca dados agregados por cliente
  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      client: true
    }
  });

  const clientStatsMap = tickets.reduce((acc: any, t) => {
    const clientId = t.clientId;
    if (!acc[clientId]) {
      acc[clientId] = {
        name: t.client.name,
        total: 0,
        resolved: 0,
        avgTime: 0,
        totalTime: 0
      };
    }
    
    acc[clientId].total += 1;
    if (t.status === 'RESOLVIDO' || t.status === 'FECHADO') {
      acc[clientId].resolved += 1;
    }
    
    // Simplificado: usa totalWorkTime se disponível para média
    if (t.totalWorkTime > 0) {
      acc[clientId].totalTime += t.totalWorkTime;
    }
    
    return acc;
  }, {});

  const clientStats = Object.values(clientStatsMap)
    .sort((a: any, b: any) => b.total - a.total);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Estatísticas por Cliente
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Ranking de volume e performance agrupado por empresa atendida.
          </p>
        </div>

        <form style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input type="date" name="start" defaultValue={format(startDate, 'yyyy-MM-dd')} style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" name="end" defaultValue={format(endDate, 'yyyy-MM-dd')} style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }} />
          </div>
          <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Filtrar</button>
        </form>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Empresa</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Total</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>% Resolução</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tempo Médio (min)</th>
            </tr>
          </thead>
          <tbody>
            {(clientStats as any[]).map((client, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', fontWeight: 700, fontSize: '0.85rem', justifyContent: 'center' }}>
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{client.name}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{client.total}</span>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: client.resolved / client.total > 0.8 ? 'var(--success)' : 'var(--warning)' }}>
                      {((client.resolved / client.total) * 100).toFixed(0)}%
                    </span>
                    <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(client.resolved / client.total) * 100}%`, height: '100%', backgroundColor: client.resolved / client.total > 0.8 ? 'var(--success)' : 'var(--warning)' }}></div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {client.totalTime > 0 ? (client.totalTime / client.total).toFixed(1) : '--'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clientStats.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Nenhuma estatística encontrada para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
}
