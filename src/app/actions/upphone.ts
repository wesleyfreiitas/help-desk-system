'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { logExternalApi } from '@/lib/apiLogger';
import https from 'https';

// A verificação de SSL será controlada pela configuração do usuário
// Helper para chamadas com bypass opcional de SSL e Log
async function upphoneFetch(service: string, url: string, options: any = {}, ignoreSsl = false) {
  const urlObj = new URL(url);
  
  // Opções para a requisição
  const fetchOptions: any = {
    ...options,
  };

  // Se ignoreSsl for true, precisamos de um agente customizado.
  // Como o fetch global do Node não aceita 'agent', usamos uma alternativa ou o dispatcher se disponível.
  // Para evitar o Warning global de process.env, usamos o modulo 'https' nativo para criar a requisição se ignoreSsl for true.
  
  if (ignoreSsl && url.startsWith('https')) {
    return new Promise<Response>((resolve, reject) => {
      const reqOptions = {
        method: options.method || 'GET',
        headers: options.headers || {},
        rejectUnauthorized: false
      };

      const req = https.request(url, reqOptions, async (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const responseProxy = {
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            status: res.statusCode!,
            headers: new Headers(res.headers as any),
            json: async () => JSON.parse(body),
            text: async () => body,
            clone: () => responseProxy // Simplificado para o logger
          } as any;

          logExternalApi(service, url, options.method || 'GET', options.body || {}, res.statusCode!, body);
          resolve(responseProxy);
        });
      });

      req.on('error', (error) => {
        logExternalApi(service, url, options.method || 'GET', options.body || {}, 0, { error: error.message });
        reject(error);
      });

      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // Fallback para fetch padrão se não precisar ignorar SSL
  try {
    const response = await fetch(url, options);
    const clonedRes = response.clone();
    let data;
    try {
      const contentType = clonedRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await clonedRes.json();
      } else {
        data = await clonedRes.text();
      }
    } catch (e) {
      data = '(falha ao ler corpo)';
    }

    logExternalApi(service, url, options.method || 'GET', options.body || {}, response.status, data);
    return response;
  } catch (error: any) {
    logExternalApi(service, url, options.method || 'GET', options.body || {}, 0, { error: error.message });
    throw error;
  }
}

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
  const ignoreSsl = config.ignoreSsl || false;

  try {
    const response = await upphoneFetch('ClickToCall', url, {}, ignoreSsl);
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
  const ignoreSsl = config.ignoreSsl || false;

  try {
    const response = await upphoneFetch('CallStatus', pollingUrl, {}, ignoreSsl);
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
    // Buscamos a config para saber se ignoramos SSL
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'upphone_config' } });
    const config = setting ? JSON.parse(setting.value) : {};
    const ignoreSsl = config.ignoreSsl || false;

    const response = await upphoneFetch('WebhookCallEnd', webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "id da ligação": channelid,
        "id do ticket": ticketId || ""
      })
    }, ignoreSsl);
    
    return { success: response.ok };
  } catch (error) {
    console.error('Webhook notification error:', error);
    return { success: false };
  }
}
