import React from 'react';
import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-layout">
      <div className="settings-header">
        <h2 className="settings-title">Configurações</h2>
        <nav className="settings-tabs">
          <Link href="/settings/custom-fields" className="settings-tab">Campos Personalizados</Link>
          <Link href="/settings/options" className="settings-tab">Opções de Ticket</Link>
          <Link href="/settings/sla" className="settings-tab">SLAs</Link>
          <Link href="/settings/canned-responses" className="settings-tab">Respostas Rápidas</Link>
          <Link href="/settings/organization" className="settings-tab">Organização</Link>
          <Link href="/settings/integrations/whatsapp" className="settings-tab">WhatsApp</Link>
          <Link href="/settings/email" className="settings-tab">E-mail (SMTP)</Link>
          <Link href="/settings/import" className="settings-tab">Importar Dados</Link>
        </nav>
      </div>
      <div className="settings-content">
        {children}
      </div>
    </div>
  );
}
