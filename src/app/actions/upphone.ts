'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getUpphoneConfig() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return null;

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'upphone_config' }
  });

  if (!setting) return { baseUrl: '', token: '' };
  
  try {
    return JSON.parse(setting.value);
  } catch (e) {
    return { baseUrl: '', token: '' };
  }
}

export async function updateUpphoneConfig(config: { baseUrl: string; token: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.systemSetting.upsert({
    where: { key: 'upphone_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'upphone_config', value: JSON.stringify(config) }
  });

  revalidatePath('/settings/integrations/upphone');
  return { success: true };
}

export async function triggerClickToCall(destinationPhone: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  // Get current user's extension
  const user = await (prisma.user as any).findUnique({
    where: { id: session.user.id }
  });

  if (!user || !user.extension) {
    throw new Error('Você não possui um ramal configurado no seu perfil.');
  }

  // Get Upphone config
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'upphone_config' }
  });

  if (!setting) {
    throw new Error('A integração com a Central Upphone não está configurada.');
  }

  const config = JSON.parse(setting.value);
  if (!config.enabled) {
    throw new Error('A integração com a Central Upphone está desativada.');
  }

  const { baseUrl, token } = config;
  if (!baseUrl || !token) {
    throw new Error('Configurações da Central Upphone incompletas.');
  }

  // Clean phone number
  const dst = destinationPhone.replace(/\D/g, '');
  const src = user.extension;

  // Upphone API call
  const url = `${baseUrl}?src=${src}&dst=${dst}&token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API Upphone: ${response.statusText}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Upphone ClickToCall Error:', error);
    throw new Error(error.message || 'Falha ao realizar chamada');
  }
}
