import { getSystemSetting } from '@/app/actions/settings';
import WhatsAppSettingsClient from './WhatsAppSettingsClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function WhatsAppSettingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return redirect('/dashboard');
  }

  const initialConfig = await getSystemSetting('whatsapp_config');

  return (
    <div className="page-container">
      <WhatsAppSettingsClient initialConfig={initialConfig} />
    </div>
  );
}
