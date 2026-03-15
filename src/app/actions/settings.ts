'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

  const { apiUrl, token, templateId, from, attendantName, attendantVarName, clientVarName } = config;

  if (!apiUrl || !token || !templateId || !from) {
    throw new Error('Configurações de WhatsApp incompletas.');
  }

  // Preparar os parâmetros dinamicamente
  const parameters: Record<string, string> = {};
  
  // Chave do atendente (default: 'nome')
  const aVar = attendantVarName || 'nome';
  parameters[aVar] = attendantName || session.user.name;

  // Chave do cliente (default: 'cliente')
  if (clientVarName) {
    parameters[clientVarName] = contactName;
  }

  // Preparar o payload conforme a cURL fornecida
  const payload = {
    body: {
      parameters,
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

// Opções de Ticket (Status, Prioridade, etc)
export async function upsertTicketOption(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const id = formData.get('id') as string;
  const type = formData.get('type') as string;
  const label = formData.get('label') as string;
  const value = formData.get('value') as string;
  const color = formData.get('color') as string;
  const order = parseInt(formData.get('order') as string || '0');

  if (id) {
    await prisma.ticketOption.update({
      where: { id },
      data: { 
        type, 
        label, 
        value, 
        color: color || null, 
        order 
      }
    });
  } else {
    await prisma.ticketOption.create({
      data: { 
        type, 
        label, 
        value, 
        color: color || null, 
        order 
      }
    });
  }

  revalidatePath('/settings/options');
}

export async function deleteTicketOption(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.ticketOption.delete({
    where: { id }
  });

  revalidatePath('/settings/options');
}
