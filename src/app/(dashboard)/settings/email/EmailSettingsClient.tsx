'use client';

import React, { useState } from 'react';
import { updateSystemSetting, testEmailConnection } from '@/app/actions/settings';
import { Mail, Server, Shield, Send, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface EmailConfig {
  host: string;
  port: string;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export default function EmailSettingsClient({ initialConfig }: { initialConfig: EmailConfig }) {
  const [config, setConfig] = useState<EmailConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSystemSetting('email_config', config);
      setMessage({ type: 'success', text: 'Configurações de e-mail salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setMessage({ type: 'success', text: 'Testando conexão SMTP...' });
    try {
      const result = await testEmailConnection(config);
      if (result.success) {
        setMessage({ type: 'success', text: 'Conexão SMTP estabelecida com sucesso! ✅' });
      } else {
        setMessage({ type: 'error', text: `Falha na conexão: ${result.error} ❌` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao testar conexão.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="table-wrapper" style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Lado Esquerdo: Servidor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
            <Server size={18} /> Servidor SMTP
          </h4>

          <div className="form-group">
            <label>Host SMTP</label>
            <input 
              type="text" 
              value={config.host} 
              onChange={e => setConfig({ ...config, host: e.target.value })}
              placeholder="smtp.exemplo.com"
            />
          </div>

          <div className="form-group">
            <label>Porta</label>
            <input 
              type="text" 
              value={config.port} 
              onChange={e => setConfig({ ...config, port: e.target.value })}
              placeholder="587 ou 465"
            />
          </div>

          <div className="form-group">
            <label>Usuário / E-mail</label>
            <input 
              type="text" 
              value={config.user} 
              onChange={e => setConfig({ ...config, user: e.target.value })}
              placeholder="seu-email@provedor.com"
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              value={config.pass} 
              onChange={e => setConfig({ ...config, pass: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Lado Direito: Identidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
            <Mail size={18} /> Identidade de Envio
          </h4>

          <div className="form-group">
            <label>E-mail de Remetente</label>
            <input 
              type="email" 
              value={config.fromEmail} 
              onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
              placeholder="suporte@suaempresa.com"
            />
          </div>

          <div className="form-group">
            <label>Nome do Remetente</label>
            <input 
              type="text" 
              value={config.fromName} 
              onChange={e => setConfig({ ...config, fromName: e.target.value })}
              placeholder="Upp HelpDesk"
            />
          </div>

          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '1.5rem',
            marginTop: '1rem'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Shield size={16} /> Dicas de Configuração
            </h5>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Use a porta **465** com SSL para conexões seguras.</li>
              <li>A porta **587** é usada geralmente com STARTTLS.</li>
              <li>Certifique-se de que o firewall permite conexões externas para estas portas.</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving || isTesting}
            className="btn-primary" 
            style={{ width: 'auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={18} />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          
          <button 
            onClick={handleTest} 
            disabled={isSaving || isTesting || !config.host}
            className="btn-outline" 
            style={{ width: 'auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={18} />
            {isTesting ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {message && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.9rem', 
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: 500
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
