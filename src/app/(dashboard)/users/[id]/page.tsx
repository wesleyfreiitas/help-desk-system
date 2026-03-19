import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserDetails } from '@/app/actions/admin';
import { getCustomFields } from '@/app/actions/customFields';
import { Edit, Trash2, ChevronLeft, ChevronRight, Plus, Phone, Mail, Tag, Clock, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import EditUserModal from './EditUserModal';
import WhatsAppButton from './WhatsAppButton';

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.user.role === 'CLIENT') return redirect('/tickets');

    const { id } = await params;
    const user = await getUserDetails(id);

    if (!user) {
        return <div style={{ padding: '2rem' }}>Usuário não encontrado.</div>;
    }

    let clients: any[] = [];
    if (session.user.role === 'ADMIN') {
        clients = await prisma.client.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
    }
    
    // Custom Fields for Users
    const userCustomFields = await getCustomFields('USER');

    // Determine the tickets to show based on user role
    // Using cast 'any' temporarily to bypass Prisma relation type mismatch if any
    const typedUser = user as any;
    const tickets = typedUser.role === 'CLIENT' && typedUser.client
        ? typedUser.client.tickets
        : (typedUser.tickets || []);

    // Group tickets by date
    const ticketsByDate: Record<string, any[]> = {};
    tickets.forEach((t: any) => {
        const dateKey = new Date(t.createdAt).toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        if (!ticketsByDate[dateKey]) ticketsByDate[dateKey] = [];
        ticketsByDate[dateKey].push(t);
    });

    const initials = user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="contact-detail-layout">
            {/* Top Action Bar */}
            <div className="detail-action-bar">
                <div className="detail-action-bar-left">
                    <EditUserModal 
                        user={user} 
                        clients={clients} 
                        currentRole={session.user.role} 
                        availableCustomFields={userCustomFields}
                    />
                    <button className="action-bar-btn danger"><Trash2 size={14} /> Excluir</button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="detail-content-grid">
                {/* Center Panel */}
                <div className="detail-main-panel">
                    {/* Profile Header */}
                    <div className="profile-header-card">
                        <div className="profile-header-info">
                            <div className="profile-avatar-large" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                {initials}
                            </div>
                            <div className="profile-header-text">
                                <h2 className="profile-name">{user.name}</h2>
                                <p className="profile-role">
                                    <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                                </p>
                                {user.client && (
                                    <Link href={`/clients/${user.client.id}`} className="profile-company-link">
                                        {user.client.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="profile-header-actions">
                            <Link href={`/tickets/new?contactId=${user.id}`} className="btn-outline-sm">
                                <Plus size={14} /> Novo chamado
                            </Link>
                            <WhatsAppButton phone={user.phone || ''} contactName={user.name} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="detail-tabs">
                        <button className="detail-tab active">TIMELINE</button>
                    </div>

                    {/* Timeline Content */}
                    <div className="timeline-entries">
                        {Object.entries(ticketsByDate).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                Nenhum chamado encontrado para este contato.
                            </div>
                        )}
                        {Object.entries(ticketsByDate).map(([date, dateTickets]) => (
                            <div key={date} className="timeline-date-group">
                                <h4 className="timeline-date-heading">{date}</h4>
                                {dateTickets.map((t: any) => {
                                    const isOverdue = t.slaResolveDate && new Date(t.slaResolveDate) < new Date() && t.status !== 'RESOLVIDO' && t.status !== 'FECHADO';
                                    const slaText = t.slaResolveDate
                                        ? isOverdue
                                            ? `Resolução atrasada em ${Math.ceil((Date.now() - new Date(t.slaResolveDate).getTime()) / (1000 * 3600))} horas`
                                            : `Resolução prevista em ${Math.ceil((new Date(t.slaResolveDate).getTime() - Date.now()) / (1000 * 3600 * 24))} dias`
                                        : null;

                                    return (
                                        <div key={t.id} className="timeline-ticket-entry">
                                            <div className="timeline-entry-left">
                                                <div className="timeline-entry-icon">
                                                    <Mail size={16} />
                                                </div>
                                                <div className="timeline-entry-content">
                                                    <div className="timeline-entry-time">
                                                        {new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {isOverdue && <span className="overdue-badge">Atrasado</span>}
                                                    <div className="timeline-entry-title">
                                                        <span className={`timeline-priority-dot priority-dot-${t.priority.toLowerCase()}`}></span>
                                                        <Link href={`/tickets/${t.id}`} className="timeline-ticket-link">
                                                            | {t.title} #{t.protocol}
                                                        </Link>
                                                    </div>
                                                    <div className="timeline-entry-meta">
                                                        Prioridade: {t.priority} · Status: {t.status.replace('_', ' ')} · Usuário: {t.assignee?.name || 'Não atribuído'}
                                                    </div>
                                                    <div className="timeline-entry-sub">
                                                        Criado {getRelativeTime(t.createdAt)}
                                                        {slaText && (
                                                            <span className="timeline-sla-info">
                                                                <Clock size={12} /> {slaText}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="detail-sidebar ticket-contact-sidebar">
                    {/* Contact Info Card */}
                    <div className="sidebar-section-v2">
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Group Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Contato
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                        <Mail size={16} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Email</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500, wordBreak: 'break-word', lineHeight: '1.2' }}>{user.email}</span>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                            <Phone size={16} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Telefone</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>{user.phone}</span>
                                                <div style={{ flexShrink: 0 }}>
                                                    <WhatsAppButton phone={user.phone} contactName={user.name} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* User Custom Fields */}
                                {user.customFields && user.customFields.length > 0 && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            {user.customFields.map((cf: any) => (
                                                <div key={cf.id} style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                                    <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                                        <Tag size={16} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{cf.field.name}</span>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: '1.2' }}>{cf.value || '--'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Company Info Card */}
                    {user.client && (
                        <div className="sidebar-section-v2" style={{ marginTop: '0.75rem' }}>
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Group Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                    <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Empresa
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                            <Globe size={16} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Razão Social</span>
                                            <Link href={`/companies/${user.client.id}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', lineHeight: '1.2' }}>
                                                {user.client.name}
                                            </Link>
                                        </div>
                                    </div>
    
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', flexShrink: 0 }}>
                                            <Tag size={16} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>CNPJ / Documento</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>{user.client.document || '--'}</span>
                                        </div>
                                    </div>

                                    {user.client.website && (
                                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                                <ExternalLink size={16} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Website</span>
                                                <a href={user.client.website.startsWith('http') ? user.client.website : `https://${user.client.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
                                                    {user.client.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Fields */}
                                {user.client.customFields && user.client.customFields.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos Adicionais</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {user.client.customFields.map((cf: any) => (
                                                <div key={cf.id} style={{ 
                                                    backgroundColor: 'var(--bg-elevated)', 
                                                    padding: '1rem', 
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                                        {cf.field.name}
                                                    </span>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: '1.5' }}>
                                                        {cf.value || '--'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
