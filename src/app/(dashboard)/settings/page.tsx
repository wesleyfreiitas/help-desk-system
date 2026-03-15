'use client';

import React from 'react';
import Link from 'next/link';
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
  CheckSquare,
  ChevronRight
} from 'lucide-react';

const categories = [
  {
    title: 'Atendimento',
    description: 'Campos personalizados, SLAs e automatizações.',
    icon: MessageSquare,
    links: [
      { label: 'Campos Personalizados', href: '/settings/custom-fields' },
      { label: 'Opções de Ticket', href: '/settings/options' },
      { label: 'Políticas de SLA', href: '/settings/sla' },
      { label: 'Respostas Rápidas', href: '/settings/canned-responses' },
    ]
  },
  {
    title: 'Segurança e Acesso',
    description: 'Controle quem pode acessar o que no sistema.',
    icon: ShieldCheck,
    links: [
      { label: 'Gerenciar Permissões', href: '/settings/permissions' },
      { label: 'Login Automático (SSO)', href: '/settings/sso' },
    ]
  },
  {
    title: 'Canais de Integração',
    description: 'WhatsApp, E-mail e redes sociais.',
    icon: Smartphone,
    links: [
      { label: 'WhatsApp API', href: '/settings/integrations/whatsapp' },
      { label: 'Configuração SMTP', href: '/settings/email' },
    ]
  },
  {
    title: 'Sistema e Dados',
    description: 'Regras de negócio e importação de legados.',
    icon: Share2,
    links: [
      { label: 'Regras da Organização', href: '/settings/organization' },
      { label: 'Distribuição Automática', href: '/settings/distribution' },
      { label: 'Importação via CSV', href: '/settings/import' },
    ]
  }
];

export default function SettingsIndexPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Central de Configurações</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie todos os aspectos do seu help desk em um só lugar.</p>
      </div>

      <div className="settings-index-grid">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="settings-category-card">
              <div className="settings-category-header">
                <div className="settings-category-icon">
                  <Icon size={24} />
                </div>
                <div className="settings-category-info">
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                </div>
              </div>

              <div className="settings-category-links">
                {cat.links.map((link, lIdx) => (
                  <Link key={lIdx} href={link.href} className="settings-category-link">
                    <span>{link.label}</span>
                    <ChevronRight size={14} className="text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
