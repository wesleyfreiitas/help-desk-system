import { getSystemSetting } from '@/app/actions/settings';
import EmailSettingsClient from './EmailSettingsClient';

export default async function EmailSettingsPage() {
  const settings = await getSystemSetting('email_config') || {
    host: '',
    port: '587',
    user: '',
    pass: '',
    fromEmail: '',
    fromName: 'Upp HelpDesk'
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Configuração de E-mail (SMTP)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure o servidor SMTP para envio de notificações de chamados e redefinição de senha.</p>
      </div>

      <EmailSettingsClient initialConfig={settings} />
    </div>
  );
}
