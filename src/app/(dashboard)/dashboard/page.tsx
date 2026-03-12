import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Clock, CheckCircle2, AlertCircle, Inbox, MessageSquare, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/analytics';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { TimeSeriesChart, ProductRankingChart, SLARingChart, ProductDistributionPie } from './DashboardCharts';

export default async function DashboardPage(props: { searchParams?: Promise<{ from?: string; to?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  // Datas padrão (últimos 30 dias)
  const params = await props.searchParams;
  const toDate = params?.to ? new Date(params.to) : endOfDay(new Date());
  const fromDate = params?.from ? new Date(params.from) : startOfDay(subDays(toDate, 30));

  // Filtragem baseada em Role
  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(user.role);
  const whereClause: any = isOrgUser
    ? { clientId: user.clientId, deletedAt: null }
    : { deletedAt: null };
    
  // Busca Analytics Completo
  const stats = await getDashboardStats(whereClause, { from: fromDate, to: toDate });

  const recentTickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { client: { include: { users: true } }, product: true, assignee: true, requester: true }
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard Suporte</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Acompanhamento do time de Suporte</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem 1rem' }}>
            {fromDate.toLocaleDateString('pt-BR')} - {toDate.toLocaleDateString('pt-BR')}
          </div>
          {user.role === 'ADMIN' && <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>MODO ADMIN</span>}
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="dashboard-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Tempo Médio Resolução <Info size={12} style={{verticalAlign: 'middle'}} /></span>
             <Clock size={20} color="#6366f1" />
           </div>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
             <span className="stat-value">{stats.metrics.mttr}</span>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>horas</span>
           </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Primeira Resposta <Info size={12} style={{verticalAlign: 'middle'}} /></span>
             <MessageSquare size={20} color="#10b981" />
           </div>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
             <span className="stat-value">{stats.metrics.mfrr}</span>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>horas</span>
           </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Cumprimento SLA <Info size={12} style={{verticalAlign: 'middle'}} /></span>
             <CheckCircle2 size={20} color="#f59e0b" />
           </div>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
             <span className="stat-value">{stats.metrics.slaCompliance}</span>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
           </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #e0e7ff' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Tickets Criados</span>
             <Inbox size={20} color="#6366f1" />
           </div>
           <span className="stat-value">{stats.metrics.createdCount}</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #fef3c7' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Tickets Pendentes</span>
             <AlertCircle size={20} color="#f59e0b" />
           </div>
           <span className="stat-value">{stats.metrics.pendingCount}</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #d1fae5' }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom: '0.5rem'}}>
             <span className="stat-title">Tickets Fechados</span>
             <CheckCircle2 size={20} color="#10b981" />
           </div>
           <span className="stat-value">{stats.metrics.closedCount}</span>
        </div>
      </div>

      {/* Saldo de Tickets (Backlog) */}
      <div className="table-wrapper" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Saldo de Tickets (Backlog do Período) <Info size={14} /></h3>
          <TrendingUp size={20} color="#f59e0b" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Backlog Inicial</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.backlog.initial}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>+ Abertos no Período</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{stats.backlog.opened}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>- Fechados no Período</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.backlog.closed}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>= Saldo Final</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.backlog.final}</div>
          </div>
        </div>
      </div>

      {/* Rankings e Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Top 10 Clientes */}
        <div className="table-wrapper" style={{ margin: 0 }}>
          <div className="table-header-filters">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Top 10 Clientes <Info size={14} /></h3>
          </div>
          <div style={{ padding: '0 1rem' }}>
            {stats.rankings.clients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 9 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ background: '#f3f4f6', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: '#6366f1' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cumprimento de SLA (Grafico) */}
        <div className="table-wrapper" style={{ margin: 0 }}>
          <div className="table-header-filters">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cumprimento de SLA <Info size={14} /></h3>
          </div>
          <SLARingChart percentage={parseFloat(stats.metrics.slaCompliance)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Top 10 Categorias */}
        <div className="table-wrapper" style={{ margin: 0 }}>
          <div className="table-header-filters">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Top 10 Categorias <Info size={14} /></h3>
          </div>
          <div style={{ padding: '0 1rem' }}>
            {stats.rankings.categories.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 9 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{i + 1}. {c.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: '#8b5cf6' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking por Produto */}
        <div className="table-wrapper" style={{ margin: 0 }}>
          <div className="table-header-filters">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ranking por Produto <Info size={14} /></h3>
          </div>
          <ProductRankingChart data={stats.rankings.products} />
        </div>
      </div>

      {/* Gráfico de Tendência (Linha) */}
      <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
        <div className="table-header-filters">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Abertos vs Fechados vs Backlog <Info size={14} /></h3>
        </div>
        <TimeSeriesChart data={stats.timeSeries} />
      </div>

      {/* Chamados Reabertos */}
      <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
        <div className="table-header-filters">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chamados Reabertos <Info size={14} /></h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {stats.metrics.reopenedTotal > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.metrics.reopenedTotal}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>Total de Reaberturas</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No período selecionado</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Sem dados disponíveis</div>
          )}
        </div>
      </div>

      {/* Chamados Recentes (Tabela Original) */}
      <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
         <div className="table-header-filters">
           <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chamados Recentes</h3>
           <Link href="/tickets" className="btn-outline">Ver Todos</Link>
         </div>
         <table className="data-table">
           <thead>
             <tr>
               <th>Ticket</th>
               <th>Assunto</th>
               {user.role !== 'CLIENT' && <th>Solicitante (Empresa)</th>}
               <th>Prioridade</th>
               <th>Status</th>
               <th>Data Criação</th>
             </tr>
           </thead>
           <tbody>
             {recentTickets.map((ticket: any) => (
               <tr key={ticket.id}>
                 <td style={{ fontWeight: 600 }}>
                   <Link href={`/tickets/${ticket.id}`}>{ticket.protocol}</Link>
                 </td>
                 <td>{ticket.title}</td>
                  {user.role !== 'CLIENT' && (
                    <td>
                      {ticket.requester?.name || ticket.client.name} ({ticket.client.name})
                    </td>
                  )}
                 <td>
                   <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                     {ticket.priority}
                   </span>
                 </td>
                 <td>
                   <span className={`badge status-${ticket.status.toLowerCase().replace('_', '')}`}>
                     {ticket.status.replace('_', ' ')}
                   </span>
                 </td>
                 <td style={{ color: 'var(--text-muted)' }}>
                   {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                 </td>
               </tr>
             ))}
             {recentTickets.length === 0 && (
               <tr>
                 <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum chamado encontrado.</td>
               </tr>
             )}
           </tbody>
         </table>
      </div>
    </>
  );
}
