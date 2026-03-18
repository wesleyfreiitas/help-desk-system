import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TicketStatusForm from './TicketStatusForm';
import TicketPropertySelect from './TicketPropertySelect';
import TicketTagsInput from './TicketTagsInput';
import TicketEmailComposer from './TicketEmailComposer';
import TimeTrackerDisplay from './TimeTrackerDisplay';
import { Clock, Reply, StickyNote, Forward, XCircle, Star, MoreHorizontal, User, Mail, Phone, ExternalLink, CheckSquare, Timer, ListTodo, AlertCircle, Paperclip, Globe } from 'lucide-react';
import WhatsAppButton from '../../users/[id]/WhatsAppButton';

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  const { id } = await params;

  const ticketResult = await prisma.ticket.findUnique({
    where: { id },
    include: {
      client: { 
        include: { 
          users: true,
          customFields: {
            include: { field: true }
          }
        } 
      },
      product: true,
      assignee: true,
      category: true,
      requester: true,
      interactions: {
        include: { user: true, attachments: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticketResult) {
    return <div>Chamado não encontrado.</div>;
  }

  const ticket = ticketResult as any;

  const products = await prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'ATTENDANT'] } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Opções Dinâmicas para os Selects
  const allOptions = (await prisma.$queryRaw`SELECT * FROM "TicketOption" ORDER BY "order" ASC`) as any[];

  const typeOptions = allOptions.filter((o: any) => o.type === 'TYPE').map((o: any) => ({ id: o.value, name: o.label }));
  const statusOptions = allOptions.filter((o: any) => o.type === 'STATUS').map((o: any) => ({ id: o.value, name: o.label }));
  const priorityOptions = allOptions.filter((o: any) => o.type === 'PRIORITY').map((o: any) => ({ id: o.value, name: o.label }));
  const sourceOptions = allOptions.filter((o: any) => o.type === 'SOURCE').map((o: any) => ({ id: o.value, name: o.label }));

  // Busca o criador real do chamado (campo createdById gravado na criação)
  const openedBy = ticket.createdById
    ? (await prisma.user.findUnique({
        where: { id: ticket.createdById },
        select: { id: true, name: true, email: true, role: true, phone: true }
      } as any))
    : null;

  if (user.role === 'CLIENT' && ticket.clientId !== user.clientId) {
    return redirect('/tickets');
  }

  const interactions = ticket.interactions.filter((i: any) => {
    if (user.role === 'CLIENT') return !i.isInternal;
    return true;
  });

  // Requester = cliente solicitante, openedBy = quem realmente clicou em "criar"
  const requesterUser = ticket.requester || ticket.client.users?.[0];
  const creatorName = openedBy?.name || requesterUser?.name || ticket.client.name;
  const creatorEmail = openedBy?.role === 'CLIENT' ? openedBy.email : (requesterUser?.email || ticket.client.email || '');
  const creatorPhone = openedBy?.phone || requesterUser?.phone || ticket.client.phone || '';
  
  // Label que descreve quem criou
  const openedByLabel = openedBy
    ? (openedBy.role === 'CLIENT' || openedBy.role === 'ORG_MANAGER' || openedBy.role === 'ORG_MEMBER' ? 'pelo portal' : 'pela plataforma')
    : 'via API';

  // SLA info
  const isOverdue = ticket.slaResolveDate && new Date(ticket.slaResolveDate) < new Date() && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO';
  const slaDaysLeft = ticket.slaResolveDate
    ? Math.ceil((new Date(ticket.slaResolveDate).getTime() - Date.now()) / (1000 * 3600 * 24))
    : null;

  return (
    <div className="ticket-detail-layout">
      {/* Main 3-column layout */}
      <div className="ticket-detail-grid">
        {/* Conversation Panel */}
        <div className="ticket-conversation-panel">
          {/* Ticket Header */}
          <div className="ticket-conv-header">
            <div className="ticket-conv-title-row">
              <Mail size={18} style={{ color: 'var(--primary)' }} />
              <h1 className="ticket-conv-title">
                <span style={{ color: 'var(--text-light)', marginRight: '8px' }}>{ticket.protocol || ticket.id.slice(0,6).toUpperCase()}</span>
                {ticket.title}
              </h1>
            </div>
            <p className="ticket-conv-creator">Criado por <strong>{creatorName}</strong></p>
          </div>

          {/* SLA Banner */}
          {ticket.slaResolveDate && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
            <div className={`ticket-sla-banner ${isOverdue ? 'overdue' : 'on-track'}`}>
              <div className="sla-status-indicator">
                <span className={`sla-dot ${isOverdue ? 'red' : 'green'}`} style={{ backgroundColor: allOptions.find((o: any) => o.type === 'STATUS' && o.value === ticket.status)?.color }}></span>
                <span>{allOptions.find((o: any) => o.type === 'STATUS' && o.value === ticket.status)?.label || ticket.status}</span>
              </div>
              <div className="sla-details">
                <Clock size={14} />
                <span>
                  {isOverdue
                    ? `Resolução atrasada em ${Math.abs(slaDaysLeft!)} dias`
                    : `Resolução prevista em ${slaDaysLeft} dias`
                  }
                </span>
                <span className="sla-date">
                  {new Date(ticket.slaResolveDate).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

          {/* Interactions Timeline */}
          <div className="ticket-interactions">
            {/* Original description as first entry */}
            <div className="interaction-card">
              <div className="interaction-header">
                <div className="interaction-user-info">
                  <div className="interaction-avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    {creatorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="interaction-author">{creatorName}</span>
                    <span className="interaction-via">reportou {openedByLabel} via {ticket.source || 'Portal'}</span>
                    <span className="interaction-time">· {getRelativeTime(ticket.createdAt)} ({new Date(ticket.createdAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} às {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                </div>
              </div>
              <div 
                className="interaction-body"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            </div>

            {/* Subsequent interactions */}
            {interactions.map((interaction: any) => {
              const initials = interaction.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={interaction.id} className={`interaction-card ${interaction.isInternal ? 'internal' : ''}`}>
                  <div className="interaction-header">
                    <div className="interaction-user-info">
                      <div className="interaction-avatar" style={{ background: interaction.isInternal ? '#fbbf24' : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
                        {initials}
                      </div>
                      <div>
                        <span className="interaction-author">{interaction.user.name}</span>
                        {interaction.isInternal && <span className="badge-internal">Nota Interna</span>}
                        <span className="interaction-via">{interaction.isInternal ? '' : 'respondeu'}</span>
                        <span className="interaction-time">· {getRelativeTime(interaction.createdAt)} ({new Date(interaction.createdAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} às {new Date(interaction.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="interaction-body"
                    dangerouslySetInnerHTML={{ __html: interaction.message }}
                  />
                  {interaction.attachments.length > 0 && (
                    <div className="interaction-attachments">
                      {interaction.attachments.map((att: any) => (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                          📎 {att.filename}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply Box - Estilo Composer de E-mail */}
          <TicketEmailComposer ticketId={ticket.id} userRole={user.role} />

        </div>

        {/* Properties Panel */}
        <div className="ticket-properties-panel">
          <h4 className="properties-title">PROPRIEDADES</h4>

          <div className="property-group">
            <label>Tags</label>
            {user.role !== 'CLIENT' ? (
              <TicketTagsInput ticketId={ticket.id} initialTags={ticket.tags || ''} />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.tags || 'Nenhuma'}</div>
            )}
          </div>

          <div className="property-group">
            <label>Tipo</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="type"
                currentValue={ticket.type}
                options={typeOptions}
                placeholder="Selecione"
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.type || 'N/A'}</div>
            )}
          </div>

          <div className="property-group">
            <label>Fonte</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="source"
                currentValue={ticket.source}
                options={sourceOptions}
                placeholder="Selecione"
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.source || 'N/A'}</div>
            )}
          </div>

          <div className="property-group">
            <label>Status *</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="status"
                currentValue={ticket.status}
                options={statusOptions}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{statusOptions.find((o: any) => o.id === ticket.status)?.name || ticket.status}</div>
            )}
          </div>

          <div className="property-group">
            <label>Prioridade</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="priority"
                currentValue={ticket.priority}
                options={priorityOptions}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{priorityOptions.find((o: any) => o.id === ticket.priority)?.name || ticket.priority}</div>
            )}
          </div>

          <div className="property-group">
            <label>Categoria</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="categoryId"
                currentValue={ticket.categoryId}
                options={categories}
                placeholder="Sem categoria"
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.category?.name || 'N/A'}</div>
            )}
          </div>

          <div className="property-group">
            <label>Usuário</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="assigneeId"
                currentValue={ticket.assigneeId}
                options={users}
                placeholder="Não atribuído"
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.assignee?.name || 'Não atribuído'}</div>
            )}
            {user.role !== 'CLIENT' && !ticket.assigneeId && (
              <span className="add-agent-link">+ Atribuir Usuário</span>
            )}
          </div>

          <div className="property-group">
            <label>Produto</label>
            {user.role !== 'CLIENT' ? (
              <TicketPropertySelect
                ticketId={ticket.id}
                field="productId"
                currentValue={ticket.productId}
                options={products}
                placeholder="Selecione"
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{ticket.product?.name || 'N/A'}</div>
            )}
          </div>

          <div className="property-group">
            <label>Tempo de Trabalho</label>
            <TimeTrackerDisplay totalSeconds={ticket.totalWorkTime || 0} lastStartedAt={ticket.lastWorkStartedAt} />
          </div>
        </div>

        {/* Contact & Company Sidebar Radical Redesign (v4) */}
        <div className="ticket-contact-sidebar" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2rem',
          padding: '0'
        }}>
          {/* Main Container - Glassmorphism-like feel */}
          <div style={{ 
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--premium-shadow)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Section with subtle gradient */}
            <div style={{ 
              padding: '2rem 1.5rem 1.5rem',
              background: 'linear-gradient(to bottom, var(--bg-elevated), transparent)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #0ea5e9 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.5rem',
                marginBottom: '1rem',
                boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.4)',
                flexShrink: 0
              }}>
                {creatorName.slice(0, 2).toUpperCase()}
              </div>
              
              <Link 
                href={`/users/${openedBy?.id || requesterUser?.id || '#'}`}
                style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  letterSpacing: '-0.02em',
                  marginBottom: '0.25rem'
                }}
              >
                {creatorName}
              </Link>
              
              <Link 
                href={`/companies/${ticket.clientId}`}
                style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {ticket.client.name} <ExternalLink size={12} />
              </Link>
            </div>

            <div style={{ padding: '0 1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Contact Details Group */}
              <div className="sidebar-section-v2">
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Contato
                    </span>
                  </div>

                  {creatorEmail && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        <Mail size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Email</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500, wordBreak: 'break-word', lineHeight: '1.2' }}>{creatorEmail}</span>
                      </div>
                    </div>
                  )}

                  {creatorPhone && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        <Phone size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Telefone</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>{creatorPhone}</span>
                          <div style={{ flexShrink: 0 }}>
                            <WhatsAppButton phone={creatorPhone} contactName={creatorName} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Details Group */}
              <div className="sidebar-section-v2">
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Empresa
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      <Globe size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>CNPJ / Documento</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>{ticket.client.document || '--'}</span>
                    </div>
                  </div>

                  {ticket.client.website && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        <ExternalLink size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Website</span>
                        <a 
                          href={ticket.client.website.startsWith('http') ? ticket.client.website : `https://${ticket.client.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}
                        >
                          Acessar Site
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Fields Group (Conditional) */}
              {ticket.client.customFields && ticket.client.customFields.length > 0 && (
                <div className="sidebar-section-v2">
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                      <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--info)', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Específico
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {ticket.client.customFields.map((cf: any) => (
                        <div key={cf.id} style={{ 
                          backgroundColor: 'var(--bg-elevated)', 
                          padding: '0.75rem 1rem', 
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            color: 'var(--text-muted)', 
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {cf.field.name}
                          </span>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-main)', 
                            fontWeight: 500,
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {cf.value === 'true' ? 'Sim' : cf.value === 'false' ? 'Não' : cf.value || '--'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffDays === 0) return `há ${diffHours} horas`;
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
}
