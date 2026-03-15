'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSystemSetting(key: string) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting ? JSON.parse(setting.value) : null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

export async function updateSystemSetting(key: string, value: any) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Não autorizado. Apenas administradores podem alterar configurações do sistema.');
  }

  const stringifiedValue = JSON.stringify(value);

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: stringifiedValue },
    create: { key, value: stringifiedValue }
  });

  revalidatePath('/settings/integrations/whatsapp');
  return { success: true };
}

export async function sendWhatsAppMessage(to: string, contactName: string) {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  // Buscar configurações da API
  const config = await getSystemSetting('whatsapp_config');
  if (!config || !config.enabled) {
    throw new Error('A integração com WhatsApp não está configurada ou está desativada.');
  }

  const { apiUrl, token, templateId, from, attendantName } = config;

  if (!apiUrl || !token || !templateId || !from) {
    throw new Error('Configurações de WhatsApp incompletas.');
  }

  // Preparar o payload conforme a cURL fornecida
  const payload = {
    body: {
      parameters: {
        nome: attendantName || session.user.name
      },
      templateId: templateId
    },
    from: from,
    to: to.replace(/\D/g, '') // Remove caracteres não numéricos
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
        'Content-Type': 'application/*+json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro na API: ${response.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    throw new Error(error.message || 'Falha ao enviar mensagem de WhatsApp');
  }
}
