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
  Info
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const logs = await prisma.accessLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="audit-page" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            Histórico completo de acessos e segurança do sistema
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {logs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem', 
            background: 'var(--surface)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Nenhum registro de acesso encontrado no banco de dados.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ 
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
            }} className="audit-card">
              
              {/* Header do Card - Estilo do print enviado */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
                marginBottom: '0.25rem'
              }}>
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
                  {getInitials(log.user.name)}
                </div>
                <div style={{ flex: 1 }}>
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
                    <User size={12} /> Atendente
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {log.user.name.toUpperCase()}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--primary)', 
                    fontWeight: 500,
                    textTransform: 'uppercase'
                  }}>
                    {log.user.role}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    Data e Hora
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: 'var(--text-main)'
                  }}>
                    <Clock size={16} className="text-primary" />
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </div>
                </div>
              </div>

              {/* Grid de Detalhes Técnicos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Informações de Rede
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      background: 'var(--bg-color)', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid var(--border-color)',
                      width: '100%'
                    }}>
                      <Globe size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.ip}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Ambiente do Usuário
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
                      border: '1px solid var(--border-color)'
                    }}>
                      <Monitor size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.browser}</span>
                    </div>
                    <div style={{ 
                      flex: 1,
                      background: 'var(--bg-color)', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <Smartphone size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.os}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Agent - Colapsado/Sutil */}
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
              }} title={log.userAgent || ''}>
                <span style={{ fontWeight: 700, marginRight: '8px' }}>UA:</span>
                {log.userAgent}
              </div>

            </div>
          ))
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
