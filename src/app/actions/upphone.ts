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
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Upphone ClickToCall Error:', error);
    throw new Error(error.message || 'Falha ao realizar chamada');
  }
}

export async function getCallStatus(channelid: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'upphone_config' }
  });

  if (!setting) throw new Error('Configuração não encontrada');
  const config = JSON.parse(setting.value);
  const { baseUrl, token } = config;

  // Extract base domain from the click2call URL
  // Example: https://upphone.absolutatelecom.com.br/confast/modules/api/click2call_v2.php
  // To: https://upphone.absolutatelecom.com.br/confast/api/v1/channel/status
  const urlObj = new URL(baseUrl);
  const pollingBase = `${urlObj.origin}/confast/api/v1/channel/status`;
  const pollingUrl = `${pollingBase}?uniqueid=${channelid}&token=${token}`;

  try {
    const response = await fetch(pollingUrl);
    if (response.status === 204) return { status: 'finished', end: true };
    if (!response.ok) throw new Error('Erro ao consultar status');
    
    const data = await response.json();
    // Finish status: "down", "busy", "unknown"
    const finishedStatus = ['down', 'busy', 'unknown'];
    const isFinished = finishedStatus.includes(data.status?.toLowerCase());
    
    return { 
      status: data.status, 
      end: isFinished 
    };
  } catch (error) {
    console.error('getCallStatus error:', error);
    throw error;
  }
}

export async function notifyCallEndWebhook(channelid: string, ticketId: string) {
  const webhookUrl = 'https://uppon-dev.absolutatecnologia.com.br/webhook/e5601aa3-d692-494d-a53f-f2fda7ca60dd';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "id da ligação": channelid,
        "id do ticket": ticketId || ""
      })
    });
    
    return { success: response.ok };
  } catch (error) {
    console.error('Webhook notification error:', error);
    return { success: false };
  }
}
