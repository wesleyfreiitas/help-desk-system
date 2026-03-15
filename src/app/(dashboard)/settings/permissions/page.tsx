import { getPermissions } from '@/app/actions/permissions';
import PermissionsSettingsClient from './PermissionsSettingsClient';

export default async function PermissionsPage() {
  const permissions = await getPermissions();

  return (
    <div style={{ padding: '0.5rem' }}>
      <PermissionsSettingsClient initialPermissions={permissions} />
    </div>
  );
}
