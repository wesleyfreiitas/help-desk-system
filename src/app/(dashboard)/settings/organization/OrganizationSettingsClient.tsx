'use client';

import React, { useState } from 'react';
import { updateOrgSettings } from '@/app/actions/settings';
import { Save, ShieldCheck, Users, Info } from 'lucide-react';

interface Rules {
  managersCanViewAll: boolean;
  membersCanViewOthers: boolean;
}

export default function OrganizationSettingsClient({ initialRules }: { initialRules: Rules }) {
  const [rules, setRules] = useState<Rules>(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateOrgSettings(rules);
      setMessage({ type: 'success', text: 'Configurações de organização salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="organization-settings" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Regras da Organização</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> Defina as permissões de visibilidade de chamados para os usuários das empresas clientes.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Managers Rule */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.25rem',
          transition: 'all 0.2s'
        }} className="hover-shadow-sm">
          <div style={{ 
            background: 'rgba(37, 99, 235, 0.1)', 
            color: 'var(--primary)', 
            padding: '12px', 
            borderRadius: '10px' 
          }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Visibilidade para Gerentes</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Permitir que usuários com papel de **Gerência (ORG_MANAGER)** visualizem chamados abertos por qualquer membro da mesma empresa.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={rules.managersCanViewAll} 
                  onChange={() => setRules(prev => ({ ...prev, managersCanViewAll: !prev.managersCanViewAll }))}
                />
                <span className="slider"></span>
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: rules.managersCanViewAll ? 'var(--primary)' : 'var(--text-muted)' }}>
                {rules.managersCanViewAll ? 'Habilitado' : 'Desabilitado'}
              </span>
            </div>
          </div>
        </div>

        {/* Members Rule */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.25rem',
          transition: 'all 0.2s'
        }} className="hover-shadow-sm">
          <div style={{ 
            background: 'rgba(var(--text-muted-rgb), 0.1)', 
            color: 'var(--text-muted)', 
            padding: '12px', 
            borderRadius: '10px' 
          }}>
            <Users size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Visibilidade entre Membros</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Permitir que **Membros da Organização (ORG_MEMBER)** visualizem chamados abertos por outros membros da mesma empresa.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={rules.membersCanViewOthers} 
                  onChange={() => setRules(prev => ({ ...prev, membersCanViewOthers: !prev.membersCanViewOthers }))}
                />
                <span className="slider"></span>
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: rules.membersCanViewOthers ? 'var(--primary)' : 'var(--text-muted)' }}>
                {rules.membersCanViewOthers ? 'Habilitado' : 'Desabilitado'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(2, 132, 199, 0.1)', 
          border: '1px solid rgba(2, 132, 199, 0.2)', 
          borderRadius: '8px', 
          padding: '1rem', 
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center' 
        }}>
          <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0 }}>
            <strong>Nota:</strong> Usuários com o papel padrão de <strong>Cliente</strong> sempre visualizam apenas seus próprios chamados, a menos que as regras acima permitam uma visão ampliada. Administradores e Atendentes sempre visualizam todos os chamados.
          </p>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-primary" 
            style={{ width: 'auto', padding: '0.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar Regras'}
          </button>

          {message && (
            <span style={{ 
              fontSize: '0.9rem', 
              color: message.type === 'success' ? '#22c55e' : '#ef4444',
              fontWeight: 500
            }}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
