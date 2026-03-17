'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { X } from 'lucide-react';

export default function Sidebar({ user, isOpen, onClose }: { user: any, isOpen: boolean, onClose: () => void }) {
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'ATTENDANT', 'CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'] },
    { label: 'Chamados', href: '/tickets', roles: ['ADMIN', 'ATTENDANT', 'CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'] },
    { label: 'Empresas', href: '/companies', roles: ['ADMIN', 'ATTENDANT'] },
    { label: 'Produtos', href: '/products', roles: ['ADMIN'] },
    { label: 'Categorias', href: '/categories', roles: ['ADMIN'] },
    { label: 'Usuários', href: '/users', roles: ['ADMIN', 'ATTENDANT'] },
    { label: 'Relatórios', href: '/reports', roles: ['ADMIN'] },
    { label: 'Configurações', href: '/settings/custom-fields', roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <img 
              src="https://suporte.absolutatelecom.com.br/arquivos/files/logo_u_black.png" 
              alt="Upp HelpDesk" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ marginLeft: '10px' }}>Upp HelpDesk</span>
          </div>
          <button 
            onClick={onClose}
            className="mobile-close-btn"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              display: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>

      <nav className="sidebar-nav">
        <ul>
          {filteredNav.map(item => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                onClick={onClose}
              >
                {item.label === 'Dashboard' && ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(user.role) ? 'Portal do Cliente' : item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-info">
            <Link href="/profile" className="user-name" title="Ver Perfil" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
              {user.name}
            </Link>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        <form action={logoutAction}>
           <button type="submit" className="btn-logout">Sair do sistema</button>
        </form>
      </div>
      </aside>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
