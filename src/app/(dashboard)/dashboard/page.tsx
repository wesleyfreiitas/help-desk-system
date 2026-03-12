import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Clock, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  // Filtragem baseada em Role
  const whereClause = user.role === 'CLIENT' 
    ? { clientId: user.clientId } 
    : {};

  // Busca dados
  const total = await prisma.ticket.count({ where: whereClause });
  const opens = await prisma.ticket.count({ 
    where: { ...whereClause, status: 'ABERTO' } 
  });
  const inProgress = await prisma.ticket.count({ 
    where: { ...whereClause, status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_TERCEIRO'] } } 
  });
  
  // Chamados atrasados (SLA Violado)
  const overdue = await prisma.ticket.count({
    where: { 
      ...whereClause, 
      status: { notIn: ['RESOLVIDO', 'FECHADO', 'CANCELADO'] },
      slaResolveDate: { lt: new Date() }
    }
  });

  const recentTickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { client: { include: { users: true } }, product: true, assignee: true, requester: true }
  });

  return (
    <>
      <div className="dashboard-grid">
        <div className="stat-card primary">
           <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className="stat-title">Total Chamados</span>
             <Inbox size={24} color="var(--primary)" />
           </div>
           <span className="stat-value">{total}</span>
        </div>

        <div className="stat-card warning">
           <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className="stat-title">Abertos / Novos</span>
             <Clock size={24} color="var(--warning)" />
           </div>
           <span className="stat-value">{opens}</span>
        </div>

        <div className="stat-card success">
           <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className="stat-title">Em Andamento</span>
             <CheckCircle2 size={24} color="var(--success)" />
           </div>
           <span className="stat-value">{inProgress}</span>
        </div>

        <div className="stat-card danger">
           <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className="stat-title">Vencidos (Atrasado)</span>
             <AlertCircle size={24} color="var(--danger)" />
           </div>
           <span className="stat-value">{overdue}</span>
        </div>
      </div>

      <div className="table-wrapper">
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
