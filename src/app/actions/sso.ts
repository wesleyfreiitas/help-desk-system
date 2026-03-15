'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type SSOConfig = {
  apiUrl: string;
  token: string;
  enabled: boolean;
};

const DEFAULT_SSO_CONFIG: SSOConfig = {
  apiUrl: 'https://api.helena.run/core/v1/agent/',
  token: 'pn_uVjECWGEkT2A9p9CXKZbYAriqhVPsvzZgBGdNZGbE',
  enabled: true
};

export async function getSSOConfig(): Promise<SSOConfig> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'sso_config' }
  });

  if (!setting) {
    return DEFAULT_SSO_CONFIG;
  }

  return JSON.parse(setting.value);
}

export async function updateSSOConfig(config: SSOConfig) {
  await prisma.systemSetting.upsert({
    where: { key: 'sso_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'sso_config', value: JSON.stringify(config) }
  });

  revalidatePath('/settings/sso');
  return { success: true };
}
