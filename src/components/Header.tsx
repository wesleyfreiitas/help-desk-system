'use client';

import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { Menu } from 'lucide-react';

export default function Header({ user, onMenuClick }: { user: any, onMenuClick: () => void }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Resumo';
    if (pathname.startsWith('/tickets')) return 'Gestão de Chamados';
    if (pathname.startsWith('/clients')) return 'Gestão de Clientes';
    if (pathname.startsWith('/products')) return 'Catálogo de Produtos';
    if (pathname.startsWith('/users')) return 'Administração de Usuários';
    if (pathname.startsWith('/reports/audit')) return 'Relatório de Auditoria de Acesso';
    if (pathname === '/profile') return 'Meu Perfil';
    return 'Bem-vindo';
  };

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-main)', 
            display: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Menu size={24} />
        </button>
        <div className="page-title">{getPageTitle()}</div>
      </div>
      
      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <ThemeToggle />
         <NotificationBell />
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .page-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </header>
  );
}
