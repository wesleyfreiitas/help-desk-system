import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserDetails } from '@/app/actions/admin';
import { Edit, Trash2, ChevronLeft, ChevronRight, Plus, Phone, Mail, Tag, Clock, AlertCircle } from 'lucide-react';
import EditUserModal from './EditUserModal';

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
                    <EditUserModal user={user} clients={clients} currentRole={session.user.role} />
                    <button className="action-bar-btn danger"><Trash2 size={14} /> Excluir</button>
                </div>
                <div className="detail-action-bar-right">
                    <Link href="/users" className="action-bar-btn"><ChevronLeft size={14} /></Link>
                    <button className="action-bar-btn"><ChevronRight size={14} /></button>
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
                            <button className="btn-outline-sm"><Plus size={14} /> Novo chamado</button>
                            <button className="btn-outline-sm"><Phone size={14} /> WhatsApp</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="detail-tabs">
                        <button className="detail-tab active">TIMELINE</button>
                        <button className="detail-tab">CHAMADOS</button>
                        <button className="detail-tab">NOTAS</button>
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
                    {/* Contact Info */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <Mail size={14} /> Informações de Contato
                        </div>
                        <div className="contact-fields-list">
                            <div className="contact-field-v2">
                                <label>E-mails</label>
                                <span>{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="contact-field-v2">
                                    <label>Telefone</label>
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            <div className="contact-field-v2">
                                <label>Tags</label>
                                <span className="sidebar-link" style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>Adicionar tags</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    {user.client && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-header">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                    <path d="M9 22v-4h6v4" />
                                    <path d="M8 6h.01" /><path d="M16 6h.01" />
                                    <path d="M12 6h.01" /><path d="M12 10h.01" />
                                    <path d="M12 14h.01" /><path d="M16 10h.01" />
                                    <path d="M16 14h.01" /><path d="M8 10h.01" />
                                    <path d="M8 14h.01" />
                                </svg>
                                Informações da Empresa
                            </div>
                            <div className="contact-fields-list">
                                <div className="contact-field-v2">
                                    <label>Razão Social</label>
                                    <Link href={`/companies/${user.client.id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                        {user.client.name}
                                    </Link>
                                </div>
                                <div className="contact-field-v2">
                                    <label>CNPJ / Documento</label>
                                    <span>{user.client.document || '--'}</span>
                                </div>
                                {user.client.website && (
                                    <div className="contact-field-v2">
                                        <label>Website</label>
                                        <a href={user.client.website.startsWith('http') ? user.client.website : `https://${user.client.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                                            {user.client.website}
                                        </a>
                                    </div>
                                )}

                                {/* Custom Fields */}
                                {user.client.customFields && user.client.customFields.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Campos Adicionais</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {user.client.customFields.map((cf: any) => (
                                                <div key={cf.id} className="contact-field-v2">
                                                    <label>{cf.field.name}</label>
                                                    <span>{cf.value || '--'}</span>
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
