import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, 
  Clock, 
  Monitor, 
  Globe, 
  Shield, 
  Smartphone,
  Info,
  Activity,
  History,
  Database,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuditPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ tab?: string }> 
}) {
  const params = await searchParams;
  const activeTab = params.tab || 'access';

  // Busca logs de acesso
  const accessLogs = activeTab === 'access' ? await prisma.accessLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  }) : [];

  // Busca logs de auditoria (ações)
  const auditLogs = activeTab === 'actions' ? await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  }) : [];

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return { bg: '#dcfce7', color: '#166534', label: 'CRIOU' };
      case 'UPDATE': return { bg: '#dbeafe', color: '#1e40af', label: 'EDITOU' };
      case 'DELETE': return { bg: '#fee2e2', color: '#991b1b', label: 'REMOVEU' };
      case 'RESTORE': return { bg: '#fef9c3', color: '#854d0e', label: 'REATIVOU' };
      default: return { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: action };
    }
  };

  const getResourceLabel = (resource: string) => {
    switch (resource) {
      case 'USER': return 'Usuário';
      case 'CLIENT': return 'Empresa';
      case 'PRODUCT': return 'Produto';
      case 'TICKET': return 'Chamado';
      case 'CATEGORY': return 'Categoria';
      case 'SYSTEM_SETTING': return 'Configuração';
      case 'ORG_SETTINGS': return 'Regras de Org';
      case 'TICKET_OPTION': return 'Opção de Ticket';
      case 'TICKET_STATUS': return 'Status de Chamado';
      case 'TICKET_INTERACTION': return 'Interação';
      case 'TICKET_FIELD': return 'Campo do Chamado';
      default: return resource;
    }
  };

  return (
    <div className="audit-page" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: 'var(--primary-light)', 
            color: 'var(--primary)', 
            padding: '10px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Registro de Auditoria</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Histórico completo de acessos e ações realizadas no sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-elevated)', 
          padding: '4px', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <Link 
            href="/reports/audit?tab=access"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'var(--transition)',
              backgroundColor: activeTab === 'access' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'access' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'access' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <History size={16} /> Login e Acessos
          </Link>
          <Link 
            href="/reports/audit?tab=actions"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'var(--transition)',
              backgroundColor: activeTab === 'actions' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'actions' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'actions' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Activity size={16} /> Ações e CRUD
          </Link>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {activeTab === 'access' && (
          accessLogs.length === 0 ? (
            <EmptyState message="Nenhum registro de acesso encontrado." />
          ) : (
            accessLogs.map((log) => (
              <AccessLogCard key={log.id} log={log} getInitials={getInitials} />
            ))
          )
        )}

        {activeTab === 'actions' && (
          auditLogs.length === 0 ? (
            <EmptyState message="Nenhum registro de ação encontrado no banco de dados." />
          ) : (
            auditLogs.map((log) => (
              <AuditLogCard 
                key={log.id} 
                log={log} 
                getInitials={getInitials} 
                getActionBadge={getActionBadge}
                getResourceLabel={getResourceLabel}
              />
            ))
          )
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .audit-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }
        .text-primary {
          color: var(--primary);
        }
      `}} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem', 
      background: 'var(--surface)', 
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-muted)'
    }}>
      <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <p>{message}</p>
    </div>
  );
}

function AccessLogCard({ log, getInitials }: { log: any, getInitials: (n: string) => string }) {
  return (
    <div style={cardStyle} className="audit-card">
      <div style={cardHeaderStyle}>
        <Avatar name={log.user.name} getInitials={getInitials} />
        <div style={{ flex: 1 }}>
          <UserLabel label="Log de Acesso" />
          <div style={userNameStyle}>{log.user.name.toUpperCase()}</div>
          <div style={userRoleStyle}>{log.user.role}</div>
        </div>
        <DateTime label="Acessou em" date={log.createdAt} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <DetailBox label="Informações de Rede" icon={<Globe size={16} color="var(--primary)" />} value={log.ip} />
        <DetailBox 
          label="Ambiente do Usuário" 
          icon={<Monitor size={16} color="var(--primary)" />} 
          value={log.browser} 
          secondaryValue={log.os}
          secondaryIcon={<Smartphone size={16} color="var(--primary)" />}
        />
      </div>
      <UserAgent ua={log.userAgent} />
    </div>
  );
}

function AuditLogCard({ log, getInitials, getActionBadge, getResourceLabel }: { 
  log: any, 
  getInitials: (n: string) => string,
  getActionBadge: (a: string) => any,
  getResourceLabel: (r: string) => string
}) {
  const action = getActionBadge(log.action);
  const resource = getResourceLabel(log.resource);
  let details = null;
  try {
    if (log.details) details = JSON.parse(log.details);
  } catch (e) {}

  return (
    <div style={cardStyle} className="audit-card">
      <div style={cardHeaderStyle}>
        <Avatar name={log.user.name} getInitials={getInitials} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              backgroundColor: action.bg, 
              color: action.color,
              padding: '2px 8px',
              borderRadius: '999px',
              textTransform: 'uppercase'
            }}>
              {action.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {resource.toUpperCase()}
            </span>
          </div>
          <div style={userNameStyle}>{log.user.name.toUpperCase()}</div>
        </div>
        <DateTime label={action.label + ' em'} date={log.createdAt} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Ação Realizada
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ opacity: 0.5 }} />
            {action.label.charAt(0) + action.label.slice(1).toLowerCase()} {resource.toLowerCase()} 
            {log.resourceId && <code style={{ backgroundColor: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '4px' }}>#{log.resourceId.slice(-6)}</code>}
          </div>
        </div>
        
        {details && (
          <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Detalhes
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(details).slice(0, 3).map(([k, v]: any) => (
                <span key={k} style={{ whiteSpace: 'nowrap' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{k}:</strong> {String(v)}
                </span>
              ))}
              {Object.keys(details).length > 3 && <span>...</span>}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Globe size={12} /> IP: {log.ip || 'desconhecido'}
      </div>
    </div>
  );
}

// Estilos Compartilhados
const cardStyle: any = {
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  transition: 'var(--transition)',
  cursor: 'default'
};

const cardHeaderStyle: any = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '1rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1rem',
  marginBottom: '0.25rem'
};

const userNameStyle: any = { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 };
const userRoleStyle: any = { fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500, textTransform: 'uppercase' };

function Avatar({ name, getInitials }: any) {
  return (
    <div style={{ 
      width: '48px', 
      height: '48px', 
      borderRadius: '12px', 
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.1rem',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
    }}>
      {getInitials(name)}
    </div>
  );
}

function UserLabel({ label }: { label: string }) {
  return (
    <div style={{ 
      fontSize: '0.65rem', 
      fontWeight: 700, 
      color: 'var(--text-muted)', 
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <User size={12} /> {label}
    </div>
  );
}

function DateTime({ label, date }: { label: string, date: Date }) {
  return (
    <div style={{ textAlign: 'right' }}>
       <div style={{ 
        fontSize: '0.65rem', 
        fontWeight: 700, 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontSize: '0.9rem', 
        fontWeight: 600,
        color: 'var(--text-main)'
      }}>
        <Clock size={16} color="var(--primary)" />
        {format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
      </div>
    </div>
  );
}

function DetailBox({ label, icon, value, secondaryValue, secondaryIcon }: any) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ 
          flex: 1,
          background: 'var(--bg-color)', 
          padding: '8px 12px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid var(--border-color)',
          minWidth: 0
        }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        </div>
        {secondaryValue && (
          <div style={{ 
            flex: 1,
            background: 'var(--bg-color)', 
            padding: '8px 12px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid var(--border-color)',
            minWidth: 0
          }}>
            {secondaryIcon}
            <span style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secondaryValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function UserAgent({ ua }: { ua?: string | null }) {
  if (!ua) return null;
  return (
    <div style={{ 
      background: '#f8fafc', 
      padding: '0.75rem 1rem', 
      borderRadius: '8px',
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      fontFamily: 'monospace',
      border: '1px dashed var(--border-color)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }} title={ua}>
      <span style={{ fontWeight: 700, marginRight: '8px' }}>UA:</span>
      {ua}
    </div>
  );
}
