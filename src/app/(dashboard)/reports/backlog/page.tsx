import { prisma } from '@/lib/prisma';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function BacklogReportPage() {
  // Busca chamados não resolvidos
  const tickets = await prisma.ticket.findMany({
    where: {
      status: {
        notIn: ['RESOLVIDO', 'FECHADO', 'CANCELADO']
      }
    },
    include: {
      client: true,
      category: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const totalBacklog = tickets.length;
  
  // Agrupa por criticidade temporal (Idade do chamado)
  const stats = {
    new: tickets.filter(t => differenceInDays(new Date(), t.createdAt) <= 3).length,
    medium: tickets.filter(t => {
      const days = differenceInDays(new Date(), t.createdAt);
      return days > 3 && days <= 7;
    }).length,
    old: tickets.filter(t => differenceInDays(new Date(), t.createdAt) > 7).length
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
          Gestão de Backlog
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Monitoramento de demanda pendente e tempo de resposta acumulado.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Pendente</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalBacklog}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#ffedd5', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Críticos (+7 dias)</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.old}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recentes (0-3 dias)</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.new}</div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--premium-shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Lista de Prioridade (Backlog)</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ordenado por data de criação (mais antigos primeiro)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{ 
              padding: '1.25rem', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              transition: 'background-color 0.2s'
            }} className="backlog-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  backgroundColor: differenceInDays(new Date(), ticket.createdAt) > 7 ? '#fee2e2' : 'var(--bg-elevated)',
                  color: differenceInDays(new Date(), ticket.createdAt) > 7 ? '#ef4444' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  minWidth: '70px'
                }}>
                  {differenceInDays(new Date(), ticket.createdAt)} dias
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>#{ticket.protocol}</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>{ticket.category?.name || 'Geral'}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{ticket.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Empresa: {ticket.client.name}</div>
                </div>
              </div>

              <Link 
                href={`/tickets/${ticket.id}`} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: 'var(--primary)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent'
                }}
                className="action-btn"
              >
                Atender <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {tickets.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Parabéns! Não há chamados pendentes no backlog.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .backlog-row:hover {
          background-color: var(--bg-elevated);
        }
        .action-btn:hover {
          background-color: var(--primary-light) !important;
        }
      `}</style>
    </div>
  );
}
