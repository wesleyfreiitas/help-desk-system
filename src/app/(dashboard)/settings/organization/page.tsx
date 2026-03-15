import { prisma } from '@/lib/prisma';
import OrganizationSettingsClient from './OrganizationSettingsClient';

export default async function OrganizationSettingsPage() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'organization_rules' }
  });

  const rules = setting ? JSON.parse(setting.value) : {
    managersCanViewAll: true,
    membersCanViewOthers: true
  };

  return <OrganizationSettingsClient initialRules={rules} />;
}
