import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import TicketListClient from './TicketListClient';
import TicketFilterSidebar from './TicketFilterSidebar';

export default async function TicketsPage(props: { searchParams: Promise<{ query?: string; status?: string; priority?: string; assigneeId?: string; clientId?: string; categoryId?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const statusFilter = searchParams?.status || '';
  const priorityFilter = searchParams?.priority || '';
  const assigneeIdFilter = searchParams?.assigneeId || '';
  const clientIdFilter = searchParams?.clientId || '';
  const categoryIdFilter = searchParams?.categoryId || '';

  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(user.role);
  const whereClause: any = isOrgUser
    ? { clientId: user.clientId, deletedAt: null }
    : { deletedAt: null };

  // Filtro Padrão: Se não houver filtro de status, mostrar apenas os "A trabalhar"
  const isDefaultView = !statusFilter && !query && !priorityFilter && !assigneeIdFilter && !clientIdFilter && !categoryIdFilter;
  
  if (statusFilter) {
    if (statusFilter === 'ALL') {
      // Mostrar todos, não adiciona filtro de status
    } else {
      whereClause.status = statusFilter;
    }
  } else if (isDefaultView || !statusFilter) {
    // Por padrão (ou se status não for ALL), remove os concluídos
    whereClause.status = { notIn: ['RESOLVIDO', 'FECHADO', 'CANCELADO'] };
  }

  if (query) {
    whereClause.title = { contains: query };
  }

  if (priorityFilter) {
    whereClause.priority = priorityFilter;
  }

  if (assigneeIdFilter && user.role !== 'CLIENT') {
    whereClause.assigneeId = assigneeIdFilter;
  }

  if (clientIdFilter && user.role !== 'CLIENT') {
    whereClause.clientId = clientIdFilter;
  }
  
  if (categoryIdFilter) {
    whereClause.categoryId = categoryIdFilter;
  }

  // Título dinâmico
  const pageTitle = statusFilter === 'ALL' ? "Todos os Chamados" : 
                    (statusFilter ? `Chamados: ${statusFilter}` : "Chamados a Trabalhar");

  const [tickets, clients, users, allOptions, categories] = await Promise.all([
    prisma.ticket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { client: { include: { users: true } }, assignee: true, product: true, requester: true, category: true }
    }),
    user.role !== 'CLIENT' ? prisma.client.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
    user.role !== 'CLIENT' ? prisma.user.findMany({ where: { role: { in: ['ADMIN', 'ATTENDANT'] }, deletedAt: null }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
    prisma.$queryRaw`SELECT * FROM "TicketOption" ORDER BY "order" ASC` as Promise<any[]>,
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } })
  ]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '2rem', alignItems: 'start' }}>

      {/* Lado Esquerdo - Lista */}
      <div className="table-wrapper" style={{ margin: 0, padding: 0, boxShadow: 'none', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{pageTitle}</h2>
          <Link href="/tickets/new" className="btn-primary" style={{ width: 'auto' }}>
            + Novo Chamado
          </Link>
        </div>

        <TicketListClient tickets={tickets} userId={user.id} users={users} options={allOptions} />
      </div>

      {/* Lado Direito - Sidebar de Filtros */}
      <TicketFilterSidebar clients={clients} users={users} options={allOptions} categories={categories} />

    </div>
  );
}
