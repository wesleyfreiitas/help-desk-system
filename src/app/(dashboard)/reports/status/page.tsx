import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, parseISO, format } from 'date-fns';
import StatusChart from './StatusChart';
import { Calendar, Filter, Percent } from 'lucide-react';

export default async function StatusReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 90)); // Padrão 90 dias para status

  // Busca chamados e opções de status para cores
  const [tickets, statusOptions] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true
      }
    }),
    prisma.ticketOption.findMany({
      where: { type: 'STATUS' }
    })
  ]);

  // Processa dados para o gráfico
  const statusCounts = tickets.reduce((acc: any, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(statusCounts).map(statusValue => {
    const option = statusOptions.find(o => o.value === statusValue);
    return {
      name: option?.label || statusValue,
      value: statusCounts[statusValue],
      color: option?.color || '#cbd5e1'
    };
  });

  const totalTickets = tickets.length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Distribuição por Status
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Visão geral da saúde e progresso dos chamados no sistema.
          </p>
        </div>

        <form style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input 
              type="date" 
              name="start" 
              defaultValue={format(startDate, 'yyyy-MM-dd')}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              name="end" 
              defaultValue={format(endDate, 'yyyy-MM-dd')}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            padding: '6px 16px', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}>
            Filtrar
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        {/* Statistics Table Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} color="var(--primary)" /> Resumo de Dados
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chartData.sort((a,b) => b.value - a.value).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{((item.value / totalTickets) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total do Período</div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{totalTickets}</div>
          </div>
        </div>

        {/* Chart Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ width: '8px', height: '24px', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Visualização de Estados</h3>
          </div>
          <StatusChart data={chartData} />
          
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Percent size={20} color="var(--text-muted)" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Este gráfico ajuda a entender o gargalo operacional. Um excesso de chamados em "Aguardando" pode indicar necessidade de ação externa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
