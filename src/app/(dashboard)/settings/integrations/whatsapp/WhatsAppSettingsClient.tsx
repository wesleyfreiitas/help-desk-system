'use client';

import { useState } from 'react';
import { Save, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { updateSystemSetting } from '@/app/actions/settings';

export default function WhatsAppSettingsClient({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig || {
    enabled: false,
    apiUrl: 'https://api.app.uppchannel.com.br/chat/v1/message/send',
    token: '',
    templateId: '',
    from: '',
    attendantName: '',
    attendantVarName: 'nome',
    clientVarName: 'cliente'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await updateSystemSetting('whatsapp_config', config);
      setStatus({ type: 'success', message: 'Configurações de WhatsApp salvas com sucesso!' });
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
          <h2 className="settings-title">Integração WhatsApp</h2>
          <p className="settings-subtitle">Configure a conexão com a API da Helena / UppChannel para envio automático de mensagens.</p>
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
          <div className="settings-section-title">
            Habilitar Integração
          </div>
          <div className="toggle-field">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={config.enabled} 
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">Ativar envio de mensagens via botão no perfil</span>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Parâmetros da API</div>
          
          <div className="form-grid">
            <div className="form-group-v2">
              <label>URL da API</label>
              <input 
                type="url" 
                value={config.apiUrl} 
                onChange={e => setConfig({ ...config, apiUrl: e.target.value })}
                placeholder="https://api.app.uppchannel.com.br/..."
                required
              />
              <span className="helper-text">Endpoint para envio de mensagens (POST).</span>
            </div>

            <div className="form-group-v2">
              <label>Token de Autorização (Bearer)</label>
              <input 
                type="password" 
                value={config.token} 
                onChange={e => setConfig({ ...config, token: e.target.value })}
                placeholder="Authorization Token"
                required
              />
            </div>

            <div className="form-group-v2">
              <label>Template ID</label>
              <input 
                type="text" 
                value={config.templateId} 
                onChange={e => setConfig({ ...config, templateId: e.target.value })}
                placeholder="Ex: id-do-template"
                required
              />
            </div>

            <div className="form-group-v2">
              <label>Canal (From)</label>
              <input 
                type="text" 
                value={config.from} 
                onChange={e => setConfig({ ...config, from: e.target.value })}
                placeholder="Ex: meu-canal"
                required
              />
            </div>

            <div className="form-group-v2">
              <label>Nome do Atendente (Valor Fixo)</label>
              <input 
                type="text" 
                value={config.attendantName} 
                onChange={e => setConfig({ ...config, attendantName: e.target.value })}
                placeholder="Deixe em branco para usar o nome do usuário logado"
              />
              <span className="helper-text">Valor enviado como nome do atendente.</span>
            </div>

            <div className="form-group-v2">
              <label>Variável do Atendente (Chave)</label>
              <input 
                type="text" 
                value={config.attendantVarName || 'nome'} 
                onChange={e => setConfig({ ...config, attendantVarName: e.target.value })}
                placeholder="Ex: nome"
              />
              <span className="helper-text">Nome da chave no template (ex: {'{{nome}}'}).</span>
            </div>

            <div className="form-group-v2">
              <label>Variável do Cliente (Chave)</label>
              <input 
                type="text" 
                value={config.clientVarName || 'cliente'} 
                onChange={e => setConfig({ ...config, clientVarName: e.target.value })}
                placeholder="Ex: cliente"
              />
              <span className="helper-text">Nome da chave no template (ex: {'{{cliente}}'}).</span>
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
        <div className="help-icon"><AlertTriangle size={20} /></div>
        <div className="help-text">
          <strong>Personalização de Variáveis:</strong> Você pode configurar os nomes das chaves acima para bater exatamente com o que está no seu template da UppChannel. 
          <br />Exemplo: Se seu template usa <code>{'{{atendente}}'}</code> e <code>{'{{prazacliente}}'}</code>, configure as chaves correspondentes acima.
        </div>
      </div>

      <style jsx>{`
        .settings-container-v2 {
          max-width: 800px;
        }
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .settings-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .settings-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-badge.active { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .status-badge.inactive { background: var(--bg-elevated); color: var(--text-muted); }

        .settings-form-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .settings-section {
          padding: 2rem;
          border-bottom: 1px solid var(--border-color);
        }
        .settings-section-title {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 1.25rem;
          color: var(--text-main);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-group-v2 {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group-v2 label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-main);
        }
        .form-group-v2 input {
          padding: 0.65rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group-v2 input:focus { border-color: var(--primary); }
        .helper-text { font-size: 0.75rem; color: var(--text-muted); }

        .settings-footer {
          padding: 1.25rem 2rem;
          background: var(--bg-elevated);
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-color);
        }
        .btn-save-settings {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.65rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-save-settings:hover { background: var(--primary-hover); }
        .btn-save-settings:disabled { opacity: 0.7; cursor: not-allowed; }

        .toggle-field {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .toggle-label { font-size: 0.9rem; color: var(--text-main); }
        
        .status-banner {
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .status-banner.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
        .status-banner.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

        .integration-help {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-lg);
          display: flex;
          gap: 1rem;
        }
        .help-icon { color: var(--warning); }
        .help-text { font-size: 0.85rem; color: var(--text-main); opacity: 0.8; line-height: 1.5; }

        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-elevated); border: 1px solid var(--border-color); transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: var(--surface); transition: .4s; }
        input:checked + .slider { background-color: var(--primary); border-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); background-color: white; }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }
      `}</style>
    </div>
  );
}
