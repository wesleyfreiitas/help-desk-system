'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Settings, 
  Database, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Users, 
  Share2, 
  FileJson, 
  Smartphone,
  PhoneCall,
  CheckSquare
} from 'lucide-react';

const groups = [
  {
    title: 'Atendimento',
    items: [
      { label: 'Visão Geral', href: '/settings', icon: Settings },
      { label: 'Campos Personalizados', href: '/settings/custom-fields', icon: Database },
      { label: 'Opções de Ticket', href: '/settings/options', icon: CheckSquare },
      { label: 'SLAs', href: '/settings/sla', icon: Clock },
      { label: 'Respostas Rápidas', href: '/settings/canned-responses', icon: MessageSquare },
    ]
  },
  {
    title: 'Canais e Integrações',
    items: [
      { label: 'WhatsApp', href: '/settings/integrations/whatsapp', icon: Smartphone },
      { label: 'Central Upphone', href: '/settings/integrations/upphone', icon: PhoneCall },
      { label: 'E-mail (SMTP)', href: '/settings/email', icon: Mail },
    ]
  },
  {
    title: 'Segurança e Acesso',
    items: [
      { label: 'Permissões', href: '/settings/permissions', icon: ShieldCheck },
      { label: 'SSO (Auto-Login)', href: '/settings/sso', icon: Users },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Organização', href: '/settings/organization', icon: Settings },
      { label: 'Distribuição', href: '/settings/distribution', icon: Share2 },
      { label: 'Importar Dados', href: '/settings/import', icon: FileJson },
    ]
  }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="settings-nav-group">
            <h4 className="settings-nav-group-title">{group.title}</h4>
            <nav>
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={iIdx} 
                    href={item.href} 
                    className={`settings-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </aside>
      
      <main className="settings-content-wrapper">
        {children}
      </main>
    </div>
  );
}
