'use client';

import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Header({ user }: { user: any }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Resumo';
    if (pathname.startsWith('/tickets')) return 'Gestão de Chamados';
    if (pathname.startsWith('/clients')) return 'Gestão de Clientes';
    if (pathname.startsWith('/products')) return 'Catálogo de Produtos';
    if (pathname.startsWith('/users')) return 'Administração de Usuários';
    if (pathname === '/profile') return 'Meu Perfil';
    return 'Bem-vindo';
  };

  return (
    <header className="top-header">
      <div className="page-title">{getPageTitle()}</div>
      
      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <ThemeToggle />
         <NotificationBell />
      </div>
    </header>
  );
}
