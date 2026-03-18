'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import nodemailer from 'nodemailer';
import { recordAuditLog } from '@/lib/audit';

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

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'SYSTEM_SETTING',
    resourceId: key,
    details: value
  });

  revalidatePath('/settings/integrations/whatsapp');
  return { success: true };
}

export async function updateOrgSettings(settings: { managersCanViewAll: boolean, membersCanViewOthers: boolean }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Não autorizado');
  }

  const key = 'organization_rules';
  const value = JSON.stringify(settings);

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'ORG_SETTINGS',
    details: settings
  });

  revalidatePath('/settings/organization');
  revalidatePath('/tickets');
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

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    throw new Error(error.message || 'Falha ao enviar mensagem de WhatsApp');
  }
}

export async function getWhatsAppMessageStatus(id: string) {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  const config = await getSystemSetting('whatsapp_config');
  if (!config || !config.enabled) throw new Error('Configuração inválida');

  // Ajustar URL para o endpoint de status: /chat/v1/message/{id}/status
  // A URL base configurada costuma ser o endpoint de envio, precisamos extrair a base correta
  let baseUrl = config.apiUrl.split('/chat/v1/')[0];
  if (!baseUrl) baseUrl = 'https://api.app.uppchannel.com.br';
  
  const statusUrl = `${baseUrl}/chat/v1/message/${encodeURIComponent(id)}/status`;

  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': config.token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('WhatsApp Status Error:', error);
    throw new Error(error.message || 'Falha ao consultar status da mensagem');
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

    await recordAuditLog({
      action: 'UPDATE',
      resource: 'TICKET_OPTION',
      resourceId: id,
      details: { type, label, value }
    });
  } else {
    const option = await prisma.ticketOption.create({
      data: { 
        type, 
        label, 
        value, 
        color: color || null, 
        order 
      }
    });

    await recordAuditLog({
      action: 'CREATE',
      resource: 'TICKET_OPTION',
      resourceId: option.id,
      details: { type, label, value }
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

  await recordAuditLog({
    action: 'DELETE',
    resource: 'TICKET_OPTION',
    resourceId: id
  });

  revalidatePath('/settings/options');
}

export async function testEmailConnection(config: { host: string, port: string, user: string, pass: string, fromEmail: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Não autorizado');

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: parseInt(config.port),
    secure: config.port === '465',
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Timeout curto para o teste não travar
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });

  try {
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    return { success: false, error: error.message };
  }
}

export async function testImapConnection(config: { host: string, port: string, user: string, pass: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Não autorizado');

  const { ImapFlow } = require('imapflow');

  const client = new ImapFlow({
    host: config.host,
    port: parseInt(config.port),
    secure: config.port === '993',
    auth: {
      user: config.user,
      pass: config.pass
    },
    logger: false
  });

  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (error: any) {
    console.error('IMAP Test Error:', error);
    return { success: false, error: error.message };
  }
}

export async function runEmailProcessor() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Não autorizado');

  const { processInboundEmails } = await import('@/lib/email-processor');
  const result = await processInboundEmails();
  
  revalidatePath('/reports/email-logs');
  return result;
}

export async function updateTicketOptionsOrder(ids: string[]) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.$transaction(
    ids.map((id, index) => 
      prisma.ticketOption.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  );

  revalidatePath('/settings/options');
}
