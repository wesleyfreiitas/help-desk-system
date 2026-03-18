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
  imapHost?: string;
  imapPort?: string;
  imapUser?: string;
  imapPass?: string;
}

export default function EmailSettingsClient({ initialConfig }: { initialConfig: EmailConfig }) {
  const [config, setConfig] = useState<EmailConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingImap, setIsTestingImap] = useState(false);
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

  const handleTestImap = async () => {
    setIsTestingImap(true);
    setMessage({ type: 'success', text: 'Testando conexão IMAP...' });
    try {
      const { testImapConnection } = await import('@/app/actions/settings');
      const imapConfig = {
        host: config.imapHost || '',
        port: config.imapPort || '',
        user: config.imapUser || '',
        pass: config.imapPass || ''
      };
      const result = await testImapConnection(imapConfig);
      if (result.success) {
        setMessage({ type: 'success', text: 'Conexão IMAP estabelecida com sucesso! ✅' });
      } else {
        setMessage({ type: 'error', text: `Falha na conexão IMAP: ${result.error} ❌` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao testar conexão IMAP.' });
    } finally {
      setIsTestingImap(false);
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

          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0 0', fontSize: '1rem', color: 'var(--primary)' }}>
            <Server size={18} /> Servidor IMAP (Recebimento)
          </h4>

          <div className="form-group">
            <label>Host IMAP</label>
            <input 
              type="text" 
              value={config.imapHost || ''} 
              onChange={e => setConfig({ ...config, imapHost: e.target.value })}
              placeholder="imap.exemplo.com"
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label>Porta IMAP</label>
              <input 
                type="text" 
                value={config.imapPort || ''} 
                onChange={e => setConfig({ ...config, imapPort: e.target.value })}
                placeholder="993"
              />
            </div>
            <div>
              <label>Usuário IMAP</label>
              <input 
                type="text" 
                value={config.imapUser || ''} 
                onChange={e => setConfig({ ...config, imapUser: e.target.value })}
                placeholder="seu-email@provedor.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Senha IMAP</label>
            <input 
              type="password" 
              value={config.imapPass || ''} 
              onChange={e => setConfig({ ...config, imapPass: e.target.value })}
              placeholder="••••••••"
            />
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
            disabled={isSaving || isTesting || isTestingImap || !config.host}
            className="btn-outline" 
            style={{ width: 'auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
          >
            <Play size={18} />
            {isTesting ? 'Smtp...' : 'Testar SMTP'}
          </button>

          <button 
            onClick={handleTestImap} 
            disabled={isSaving || isTesting || isTestingImap || !config.imapHost}
            className="btn-outline" 
            style={{ width: 'auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
          >
            <Play size={18} />
            {isTestingImap ? 'Imap...' : 'Testar IMAP'}
          </button>
        </div>

        {message && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.9rem', 
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
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
