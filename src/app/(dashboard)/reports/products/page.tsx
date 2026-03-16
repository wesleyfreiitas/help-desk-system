import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, parseISO, format } from 'date-fns';
import GenericBarChart from '../components/GenericBarChart';
import { Calendar, Package, Info } from 'lucide-react';

export default async function ProductsReportPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 90));

  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      productId: { not: null }
    },
    include: {
      product: true
    }
  });

  const productCounts = tickets.reduce((acc: any, t) => {
    const name = t.product?.name || 'Sem Produto';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(productCounts)
    .map(name => ({ name, value: productCounts[name] }))
    .sort((a, b) => b.value - a.value);

  const totalTickets = tickets.length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Chamados por Produto
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Distribuição de tickets baseada no catálogo de produtos.
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Package size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Ranking de Produtos</h3>
          </div>
          <GenericBarChart data={chartData} color="#8b5cf6" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Total</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)' }}>{totalTickets}</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chamados com produto vinculado no período selecionado.</p>
          </div>

          <div style={{ backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <Info size={18} />
              <span style={{ fontWeight: 700 }}>Insight de Produto</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              {chartData.length > 0 
                ? `O produto "${chartData[0].name}" representa o maior volume de chamados. Considere revisar a documentação ou treinamentos desta área.`
                : 'Não há dados suficientes para gerar insights automáticos no momento.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
