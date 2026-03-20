'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import ClickToCallButton from '@/components/ClickToCallButton';
import WhatsAppButton from '@/app/(dashboard)/users/[id]/WhatsAppButton';

interface Props {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  clientName: string;
  clientDocument: string;
  clientWebsite?: string;
  contactUserId?: string;   // para linkar ao perfil do usuário
  clientId?: string;        // para linkar à empresa
  ticketId?: string;        // para o ClickToCallButton
  customFields?: any[];
}

export default function TicketContactSidebar({
  contactName,
  contactEmail,
  contactPhone,
  clientName,
  clientDocument,
  clientWebsite,
  contactUserId,
  clientId,
  ticketId,
  customFields = [],
}: Props) {
  const [contatoOpen, setContatoOpen] = useState(true);
  const [empresaOpen, setEmpresaOpen] = useState(true);

  const initials = contactName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="tc-sidebar">
      {/* Header do contato */}
      <div className="tc-header">
        <div className="tc-avatar">{initials}</div>

        {contactUserId ? (
          <Link href={`/users/${contactUserId}`} className="tc-name tc-link">
            {contactName}
          </Link>
        ) : (
          <div className="tc-name">{contactName}</div>
        )}

        {clientId ? (
          <Link href={`/companies/${clientId}`} className="tc-company tc-link">
            {clientName}
          </Link>
        ) : (
          <div className="tc-company">{clientName}</div>
        )}
      </div>

      {/* Seção Contato Info */}
      <div className="tc-section">
        <button className="tc-section-title" onClick={() => setContatoOpen(o => !o)}>
          <span>CONTATO INFO</span>
          {contatoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {contatoOpen && (
          <div className="tc-section-body">
            {contactEmail && (
              <div className="tc-row">
                <Mail size={15} className="tc-row-icon" />
                <div className="tc-row-content">
                  <span className="tc-row-label">EMAIL</span>
                  <span className="tc-row-value">{contactEmail}</span>
                </div>
              </div>
            )}

            {contactPhone && (
              <div className="tc-row">
                <Phone size={15} className="tc-row-icon" />
                <div className="tc-row-content">
                  <span className="tc-row-label">TELEFONE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="tc-row-value">{contactPhone}</span>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <ClickToCallButton phone={contactPhone} ticketId={ticketId} />
                      <WhatsAppButton phone={contactPhone} contactName={contactName} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção Empresa */}
      <div className="tc-section">
        <button className="tc-section-title" onClick={() => setEmpresaOpen(o => !o)}>
          <span>EMPRESA</span>
          {empresaOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {empresaOpen && (
          <div className="tc-section-body">
            {clientDocument && (
              <div className="tc-field">
                <span className="tc-row-label">CNPJ / DOCUMENTO</span>
                <span className="tc-row-value">{clientDocument}</span>
              </div>
            )}

            {customFields.map((cf: any) => (
              <div key={cf.id} className="tc-field">
                <span className="tc-row-label">{cf.field?.name?.toUpperCase()}</span>
                <span className="tc-row-value">{cf.value === 'true' ? 'Sim' : cf.value === 'false' ? 'Não' : cf.value || '--'}</span>
              </div>
            ))}

            {clientWebsite && (
              <div className="tc-field">
                <span className="tc-row-label">WEBSITE</span>
                <a
                  href={clientWebsite.startsWith('http') ? clientWebsite : `https://${clientWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tc-row-value"
                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                >
                  {clientWebsite}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
