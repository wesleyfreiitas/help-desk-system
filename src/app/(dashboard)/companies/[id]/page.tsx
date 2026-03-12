import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getClientDetails } from '@/app/actions/admin';
import { Edit, Trash2, ChevronLeft, ChevronRight, Mail, Clock, Users, Upload, AlertCircle } from 'lucide-react';
import EditEmpresaModal from './EditEmpresaModal';

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.user.role === 'CLIENT') return redirect('/tickets');

    const { id } = await params;
    const client = await getClientDetails(id);

    if (!client) {
        return <div style={{ padding: '2rem' }}>Empresa não encontrada.</div>;
    }

    // Group tickets by date
    const ticketsByDate: Record<string, any[]> = {};
    client.tickets.forEach((t: any) => {
        const dateKey = new Date(t.createdAt).toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        if (!ticketsByDate[dateKey]) ticketsByDate[dateKey] = [];
        ticketsByDate[dateKey].push(t);
    });

    return (
        <div className="contact-detail-layout">
            {/* Breadcrumb */}
            <div className="detail-breadcrumb">
                <Link href="/companies" className="breadcrumb-link">Empresas</Link>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-current">{client.name}</span>
            </div>

            {/* Top Action Bar */}
            <div className="detail-action-bar">
                <div className="detail-action-bar-left">
                    <EditEmpresaModal client={client} />
                    <button className="action-bar-btn danger"><Trash2 size={14} /> Excluir</button>
                </div>
                <div className="detail-action-bar-right">
                    <Link href="/companies" className="action-bar-btn"><ChevronLeft size={14} /></Link>
                    <button className="action-bar-btn"><ChevronRight size={14} /></button>
                </div>
            </div>

            {/* Main Content */}
            <div className="detail-content-grid">
                {/* Center Panel */}
                <div className="detail-main-panel">
                    {/* Company Header */}
                    <div className="profile-header-card">
                        <div className="profile-header-info">
                            <div className="company-avatar-large">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                    <path d="M9 22v-4h6v4" />
                                    <path d="M8 6h.01" /><path d="M16 6h.01" />
                                    <path d="M12 6h.01" /><path d="M12 10h.01" />
                                    <path d="M12 14h.01" /><path d="M16 10h.01" />
                                    <path d="M16 14h.01" /><path d="M8 10h.01" />
                                    <path d="M8 14h.01" />
                                </svg>
                            </div>
                            <div className="profile-header-text">
                                <h2 className="profile-name">{client.name}</h2>
                                <p className="profile-subtitle">{client.users.length} contato(s)</p>
                                {client.email && <p className="profile-subtitle">{client.email}</p>}
                            </div>
                        </div>
                        <div className="profile-header-actions">
                            <button className="btn-outline-sm"><Upload size={14} /> Enviar foto</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="detail-tabs">
                        <button className="detail-tab active">TIMELINE</button>
                    </div>

                    {/* Timeline */}
                    <div className="timeline-entries">
                        {Object.entries(ticketsByDate).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                Nenhum chamado encontrado para esta empresa.
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
                                                    {isOverdue && <span className="overdue-badge">Atrasado</span>}
                                                    <div className="timeline-entry-title">
                                                        <span className={`timeline-priority-dot priority-dot-${t.priority.toLowerCase()}`}></span>
                                                        <Link href={`/tickets/${t.id}`} className="timeline-ticket-link">
                                                            | {t.title} #{t.protocol}
                                                        </Link>
                                                    </div>
                                                    <div className="timeline-entry-meta">
                                                        Status: {t.status.replace('_', ' ')} · Usuário: {t.assignee?.name || 'Não atribuído'}
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
                                            <div className="timeline-entry-right">
                                                <span className="timeline-entry-created">
                                                    Criado {getRelativeTime(t.createdAt)}
                                                </span>
                                                {slaText && (
                                                    <span className={`timeline-sla-badge ${isOverdue ? 'overdue' : ''}`}>
                                                        <Clock size={12} /> {slaText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar — Contacts */}
                <div className="detail-sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <h4><AlertCircle size={14} /> Dados Adicionais</h4>
                        </div>
                        <div className="sidebar-section-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Website</span>
                                    <span style={{ fontSize: '0.9rem' }}>{client.website || '--'}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CNPJ / Documento</span>
                                    <span style={{ fontSize: '0.9rem' }}>{client.document || '--'}</span>
                                </div>
                                {client.customFields && client.customFields.map((cf: any) => (
                                    <div key={cf.id}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{cf.field.name}</span>
                                        <span style={{ fontSize: '0.9rem' }}>{cf.value || '--'}</span>
                                    </div>
                                ))}
                                {(!client.customFields || client.customFields.length === 0) && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum campo personalizado preenchido.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <h4><Users size={14} /> Contatos ({client.users.length})</h4>
                        </div>
                        <div className="sidebar-section-body">
                            {client.users.map((u: any) => {
                                const initials = u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                                return (
                                    <Link key={u.id} href={`/users/${u.id}`} className="contact-list-item">
                                        <div className="contact-avatar-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                            {initials}
                                        </div>
                                        <div className="contact-info-text">
                                            <span className="contact-name">{u.name}</span>
                                            <span className="contact-role">{u.role}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                            {client.users.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum contato cadastrado.</p>
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
