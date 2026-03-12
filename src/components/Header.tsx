'use client';

import { usePathname } from 'next/navigation';

export default function Header({ user }: { user: any }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Resumo';
    if (pathname.startsWith('/tickets')) return 'Gestão de Chamados';
    if (pathname.startsWith('/clients')) return 'Gestão de Clientes';
    if (pathname.startsWith('/products')) return 'Catálogo de Produtos';
    if (pathname.startsWith('/users')) return 'Administração de Usuários';
    return 'Bem-vindo';
  };

  return (
    <header className="top-header">
      <div className="page-title">{getPageTitle()}</div>
      
      <div className="top-actions">
         {user.role !== 'CLIENT' && (
           <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
             Modo Staff
           </span>
         )}
      </div>
    </header>
  );
}
