'use client';

import { useState } from 'react';
import { Save, CheckCircle2, ShieldAlert, PhoneCall, Info } from 'lucide-react';
import { updateUpphoneConfig } from '@/app/actions/upphone';

export default function UpphoneSettingsClient({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig || {
    enabled: false,
    baseUrl: 'https://upphone.absolutatelecom.com.br/confast/modules/api/click2call_v2.php',
    token: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateUpphoneConfig(config);
      setStatus({ type: 'success', message: 'Configurações da Central Upphone salvas com sucesso!' });
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container-v2">
      <div className="settings-header">
        <div>
          <h2 className="settings-title">Central Upphone (Click to Call)</h2>
          <p className="settings-subtitle">Configure a integração para realizar chamadas diretamente do navegador.</p>
        </div>
        <div className={`status-badge ${config.enabled ? 'active' : 'inactive'}`}>
          {config.enabled ? 'Ativo' : 'Inativo'}
        </div>
      </div>

      {status && (
        <div className={`status-banner ${status.type}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSave} className="settings-form-card">
        <div className="settings-section">
          <div className="settings-section-title">Habilitar Integração</div>
          <div className="toggle-field">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={config.enabled} 
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">Ativar botões de ligar nos cards de contato e chamados</span>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Parâmetros de Conexão</div>
          <div className="form-grid">
            <div className="form-group-v2" style={{ gridColumn: '1 / span 2' }}>
              <label>URL Base da API</label>
              <input 
                type="url" 
                value={config.baseUrl} 
                onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://..."
                required
              />
              <span className="helper-text">Endpoint fornecido pela Upphone para o Click2Call.</span>
            </div>

            <div className="form-group-v2" style={{ gridColumn: '1 / span 2' }}>
              <label>Token de Autenticação</label>
              <input 
                type="password" 
                value={config.token} 
                onChange={e => setConfig({ ...config, token: e.target.value })}
                placeholder="Token da API"
                required
              />
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button type="submit" className="btn-save-settings" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      <div className="integration-help">
        <div className="help-icon"><Info size={20} /></div>
        <div className="help-text">
          <strong>Como funciona:</strong> Ao clicar no ícone de telefone <PhoneCall size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />, o sistema disparará uma requisição para a Upphone usando o <strong>Ramal (src)</strong> configurado no perfil do atendente e o <strong>Telefone (dst)</strong> do cliente.
          <br /><br />
          Certifique-se de que os atendentes tenham o campo "Ramal" preenchido em seus cadastros.
        </div>
      </div>

      <style jsx>{`
        .settings-container-v2 { max-width: 800px; }
        .settings-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .settings-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
        .settings-subtitle { color: var(--text-muted); font-size: 0.9rem; }
        
        .status-badge { padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-badge.active { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .status-badge.inactive { background: var(--bg-elevated); color: var(--text-muted); }

        .settings-form-card { background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden; }
        .settings-section { padding: 2rem; border-bottom: 1px solid var(--border-color); }
        .settings-section-title { font-weight: 600; font-size: 1rem; margin-bottom: 1.25rem; color: var(--text-main); }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group-v2 { display: flex; flexDirection: column; gap: 0.5rem; }
        .form-group-v2 label { font-size: 0.85rem; font-weight: 500; color: var(--text-main); }
        .form-group-v2 input { padding: 0.65rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; outline: none; transition: border-color 0.2s; background: var(--bg-elevated); color: var(--text-main); }
        .form-group-v2 input:focus { border-color: var(--primary); }
        .helper-text { font-size: 0.75rem; color: var(--text-muted); }

        .settings-footer { padding: 1.25rem 2rem; background: var(--bg-elevated); display: flex; justify-content: flex-end; border-top: 1px solid var(--border-color); }
        .btn-save-settings { background: var(--primary); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: background 0.2s; }
        .btn-save-settings:hover { background: var(--primary-hover); }
        .btn-save-settings:disabled { opacity: 0.7; cursor: not-allowed; }

        .status-banner { padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; font-weight: 500; }
        .status-banner.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
        .status-banner.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

        .toggle-field { display: flex; align-items: center; gap: 1rem; }
        .toggle-label { font-size: 0.9rem; color: var(--text-main); }
        
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-elevated); border: 1px solid var(--border-color); transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: var(--surface); transition: .4s; }
        input:checked + .slider { background-color: #6366f1; border-color: #6366f1; }
        input:checked + .slider:before { transform: translateX(20px); background-color: white; }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }

        .integration-help { margin-top: 2rem; padding: 1.5rem; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-lg); display: flex; gap: 1rem; }
        .help-icon { color: #6366f1; }
        .help-text { font-size: 0.85rem; color: var(--text-main); opacity: 0.9; line-height: 1.5; }
      `}</style>
    </div>
  );
}
