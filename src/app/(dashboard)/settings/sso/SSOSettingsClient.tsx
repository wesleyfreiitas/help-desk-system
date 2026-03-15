'use client';

import { useState } from 'react';
import { SSOConfig, updateSSOConfig } from '@/app/actions/sso';
import { Save, Globe, Key, AlertCircle } from 'lucide-react';

export default function SSOSettingsClient({ initialConfig }: { initialConfig: SSOConfig }) {
  const [config, setConfig] = useState<SSOConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSSOConfig(config);
      alert('Configurações de SSO salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações de SSO');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sso-settings">
      <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Configurações de SSO (Helena API)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure os parâmetros de integração para login automático via URL.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingBottom: '2rem', 
          marginBottom: '2rem', 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Ativar Integração</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Habilite ou desabilite o login automático via API Helena.</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={config.enabled} 
              onChange={e => setConfig({...config, enabled: e.target.checked})}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={16} className="text-muted" /> URL Base da API
          </label>
          <input 
            type="text" 
            className="form-control" 
            value={config.apiUrl} 
            onChange={e => setConfig({...config, apiUrl: e.target.value})}
            placeholder="https://api.helena.run/core/v1/agent/"
            disabled={!config.enabled}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            A URL onde o sistema consultará as informações do usuário passando o ID.
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} className="text-muted" /> Token de Autorização (Bearer)
          </label>
          <input 
            type="password" 
            className="form-control" 
            value={config.token} 
            onChange={e => setConfig({...config, token: e.target.value})}
            placeholder="pn_..."
            disabled={!config.enabled}
          />
        </div>

        <div style={{ padding: '1rem', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.2)', display: 'flex', gap: '0.75rem' }}>
          <AlertCircle size={20} className="text-primary" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <strong>Como funciona:</strong> Ao acessar `/login?user=XYZ&company=ABC`, o sistema fará um GET em `URL_BASE/USER_ID` enviando o Token no header de Authorization. Se o retorno for válido, o usuário entra automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}
