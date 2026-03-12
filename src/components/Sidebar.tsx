'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'ATTENDANT', 'CLIENT'] },
    { label: 'Chamados', href: '/tickets', roles: ['ADMIN', 'ATTENDANT', 'CLIENT'] },
    { label: 'Empresas', href: '/companies', roles: ['ADMIN', 'ATTENDANT'] },
    { label: 'Produtos', href: '/products', roles: ['ADMIN', 'ATTENDANT'] },
    { label: 'Categorias', href: '/categories', roles: ['ADMIN', 'ATTENDANT'] },
    { label: 'Usuários', href: '/users', roles: ['ADMIN'] },
    { label: 'Configurações', href: '/settings/custom-fields', roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        🚀 HelpDesk
      </div>

      <nav className="sidebar-nav">
        <ul>
          {filteredNav.map(item => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              >
                {item.label}
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
            <span className="user-name" title={user.name}>{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        <form action={logoutAction}>
           <button type="submit" className="btn-logout">Sair do sistema</button>
        </form>
      </div>
    </aside>
  );
}
