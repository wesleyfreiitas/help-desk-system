'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Geral', href: '/reports' },
    { label: 'Auditoria', href: '/reports/audit' },
  ];

  return (
    <div className="reports-container">
      <div className="reports-tabs" style={{ 
        display: 'flex', 
        gap: '2rem', 
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.75rem 0.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: pathname === tab.href ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: pathname === tab.href ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
