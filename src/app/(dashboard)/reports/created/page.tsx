import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreatedChart from './CreatedChart';
import { Calendar, TrendingUp, Info } from 'lucide-react';

export default async function CreatedReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  // Datas padrão: últimos 30 dias
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 30));

  // Busca chamados no período
  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      createdAt: true
    }
  });

  // Agrupa dados por dia para o gráfico
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const label = format(day, 'dd/MM', { locale: ptBR });
    const count = tickets.filter(t => format(t.createdAt, 'yyyy-MM-dd') === dateStr).length;
    return { date: label, count };
  });

  const totalTickets = tickets.length;
  const avgPerDay = totalTickets / days.length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Chamados Criados no Período
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Análise temporal detalhada de abertura de chamados.
          </p>
        </div>

        {/* Filtro Simples - Form com GET */}
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

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Chamados</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>{totalTickets}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Média Diária</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>{avgPerDay.toFixed(1)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
            <TrendingUp size={16} /> 
            <span>Tendência Estável</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Baseado no período anterior</p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <div style={{ width: '8px', height: '24px', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Volume de Aberturas</h3>
        </div>
        <CreatedChart data={chartData} />
      </div>

      {/* Info Banner */}
      <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--primary-light)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--primary)', color: 'var(--primary-dark)', marginBottom: '2rem' }}>
        <Info style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
          <strong>Dica:</strong> Utilize este relatório para identificar picos de demanda e planejar a escala da equipe de atendimento. Os dados mostrados consideram todos os canais de abertura (Portal, E-mail e API).
        </p>
      </div>
    </div>
  );
}
