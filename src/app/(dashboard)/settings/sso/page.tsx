import { getSSOConfig } from '@/app/actions/sso';
import SSOSettingsClient from './SSOSettingsClient';

export default async function SSOSettingsPage() {
  const config = await getSSOConfig();

  return (
    <div style={{ padding: '0.5rem' }}>
      <SSOSettingsClient initialConfig={config} />
    </div>
  );
}
