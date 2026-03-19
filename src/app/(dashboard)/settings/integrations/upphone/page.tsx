import { getUpphoneConfig } from '@/app/actions/upphone';
import UpphoneSettingsClient from './UpphoneSettingsClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UpphoneSettingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return redirect('/dashboard');
  }

  const initialConfig = await getUpphoneConfig();

  return (
    <div className="page-container">
      <UpphoneSettingsClient initialConfig={initialConfig} />
    </div>
  );
}
