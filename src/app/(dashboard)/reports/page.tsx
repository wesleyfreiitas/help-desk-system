import Link from 'next/link';
import { 
  BarChart3, 
  PieChart, 
  CalendarRange, 
  Package, 
  Building2, 
  Clock9, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const reportCards = [
    {
      title: 'Criados no Período',
      description: 'Acompanhe o volume de aberturas de chamados em intervalos específicos.',
      icon: <CalendarRange size={24} />,
      href: '/reports/created',
      color: '#6366f1', // Indigo
      badge: 'Temporal'
    },
    {
      title: 'Distribuição por Status',
      description: 'Visualize como os chamados estão distribuídos entre os diferentes estados.',
      icon: <PieChart size={24} />,
      href: '/reports/status',
      color: '#0ea5e9', // Sky
      badge: 'Status'
    },
    {
      title: 'Demanda por Produto',
      description: 'Identifique quais produtos estão gerando maior volume de solicitações.',
      icon: <Package size={24} />,
      href: '/reports/products',
      color: '#8b5cf6', // Violet
      badge: 'Produtos'
    },
    {
      title: 'Análise por Categoria',
      description: 'Entenda os assuntos mais recorrentes tratados pelo suporte.',
      icon: <BarChart3 size={24} />,
      href: '/reports/categories',
      color: '#f59e0b', // Amber
      badge: 'Categorias'
    },
    {
      title: 'Estatísticas por Cliente',
      description: 'Métricas detalhadas de performance e volume agrupadas por empresa.',
      icon: <Building2 size={24} />,
      href: '/reports/clients',
      color: '#10b981', // Emerald
      badge: 'Clientes'
    },
    {
      title: 'Gestão de Backlog',
      description: 'Analise chamados pendentes e identifique gargalos de atendimento.',
      icon: <Clock9 size={24} />,
      href: '/reports/backlog',
      color: '#ef4444', // Red
      badge: 'Backlog'
    },
    {
      title: 'Auditoria de Acessos',
      description: 'Log detalhado de acessos e logins realizados no sistema.',
      icon: <ShieldCheck size={24} />,
      href: '/reports/audit',
      color: '#64748b', // Slate
      badge: 'Segurança'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 800, 
          color: 'var(--text-main)', 
          letterSpacing: '-0.025em',
          marginBottom: '0.5rem'
        }}>
          Central de Relatórios Analíticos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Selecione uma categoria abaixo para visualizar os dados e métricas do sistema.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '1.5rem',
        paddingBottom: '3rem'
      }}>
        {reportCards.map((report, index) => (
          <Link 
            key={index} 
            href={report.href}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div className="report-card-premium" style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Card Accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: report.color
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  backgroundColor: `${report.color}10`, // 10% opacity
                  color: report.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {report.icon}
                </div>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  backgroundColor: 'var(--bg-elevated)', 
                  padding: '4px 10px', 
                  borderRadius: '999px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {report.badge}
                </span>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {report.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-muted)', 
                  lineHeight: '1.5',
                  marginBottom: '1rem'
                }}>
                  {report.description}
                </p>
              </div>

              <div style={{ 
                marginTop: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: report.color 
              }}>
                Acessar relatório <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .report-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: var(--premium-shadow) !important;
          border-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
