import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, parseISO, format } from 'date-fns';
import { Calendar, Building2, TrendingDown, Users, AlertTriangle } from 'lucide-react';

export default async function LowVolumeClientsReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 90));

  // 1. Busca todos os clientes ativos e conta seus chamados no período
  const allClients = await prisma.client.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          tickets: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
              deletedAt: null
            }
          }
        }
      }
    }
  });

  // 2. Ordena de forma crescente (quem menos abriu) e pega os 10 primeiros
  const sortedClients = [...allClients]
    .sort((a, b) => a._count.tickets - b._count.tickets)
    .slice(0, 10);

  const clientIds = sortedClients.map(c => c.id);

  // 3. Busca os chamados desses 10 clientes para calcular taxas de resolução e tempo
  const tickets = await prisma.ticket.findMany({
    where: {
      clientId: { in: clientIds },
      createdAt: { gte: startDate, lte: endDate },
      deletedAt: null
    }
  });

  // 4. Agrega as estatísticas
  const clientStatsMap = sortedClients.reduce((acc: any, client) => {
    const clientTickets = tickets.filter(t => t.clientId === client.id);
    
    acc[client.id] = {
      name: client.name,
      total: client._count.tickets,
      resolved: clientTickets.filter(t => t.status === 'RESOLVIDO' || t.status === 'FECHADO').length,
      totalTime: clientTickets.reduce((sum, t) => sum + (t.totalWorkTime || 0), 0)
    };
    
    return acc;
  }, {});

  const clientStats = sortedClients.map(c => clientStatsMap[c.id]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Top 10 - Clientes com Menor Volume
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Empresas com menor engajamento ou demanda de suporte no período.
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
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Posição / Empresa</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chamados Abertos</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>% Resolução</th>
              <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tempo Médio (min)</th>
            </tr>
          </thead>
          <tbody>
            {clientStats.map((client, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      backgroundColor: idx < 3 ? 'var(--warning-light)' : 'var(--bg-elevated)', 
                      color: idx < 3 ? 'var(--warning)' : 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{client.name}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: client.total === 0 ? 'var(--text-muted)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    {client.total}
                    {client.total === 0 && <AlertTriangle size={14} color="#f59e0b" />}
                  </span>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  {client.total > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 600, color: client.resolved / client.total > 0.8 ? 'var(--success)' : 'var(--warning)' }}>
                        {((client.resolved / client.total) * 100).toFixed(0)}%
                      </span>
                      <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(client.resolved / client.total) * 100}%`, height: '100%', backgroundColor: client.resolved / client.total > 0.8 ? 'var(--success)' : 'var(--warning)' }}></div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                  )}
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {client.total > 0 && client.totalTime > 0 ? (client.totalTime / client.total).toFixed(1) : '--'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clientStats.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Nenhum cliente cadastrado no sistema.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px', border: '1px solid var(--primary-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <AlertTriangle size={24} />
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Nota para Gestão</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
            Clientes com volume zero ou muito baixo podem precisar de acompanhamento (Customer Success) para garantir que estão utilizando a plataforma corretamente ou se há problemas de adoção.
          </p>
        </div>
      </div>
    </div>
  );
}
