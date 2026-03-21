import { prisma } from './prisma';

/**
 * Registra logs de chamadas para APIs externas no Banco de Dados.
 * Substitui o log em arquivo para compatibilidade com ambientes serverless/restritos.
 */
export async function logExternalApi(
  service: string,
  url: string,
  method: string,
  payload: any,
  status: number,
  response: any
) {
  try {
    // Mascarar tokens sensíveis no log
    let safeUrl = url;
    if (url.includes('token=')) {
      safeUrl = url.replace(/token=[^&]+/, 'token=***');
    }

    let safePayload = payload;
    if (payload && typeof payload === 'object') {
      safePayload = { ...payload };
      if (safePayload.token) safePayload.token = '***';
    }

    // Tenta salvar no banco de dados
    await prisma.externalApiLog.create({
      data: {
        service: service.toUpperCase(),
        method,
        url: safeUrl,
        payload: payload ? (typeof safePayload === 'string' ? safePayload : JSON.stringify(safePayload)) : null,
        status,
        response: response ? (typeof response === 'string' ? response : JSON.stringify(response)) : null,
      }
    });
  } catch (err) {
    // Falha silenciosa no log para não quebrar a aplicação principal
    console.error('Failed to save external API log to database:', err);
  }
}

/**
 * Registra erros do sistema (runtime, database, etc.) no Banco de Dados.
 */
export async function logSystemError(context: string, error: any, details?: any) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    await prisma.externalApiLog.create({
      data: {
        service: 'SYSTEM_ERROR',
        method: context.toUpperCase(),
        url: details?.url || 'INTERNAL',
        status: 500,
        payload: details ? JSON.stringify(details) : null,
        response: JSON.stringify({
          message: errorMessage,
          stack: errorStack
        })
      }
    });
  } catch (err) {
    console.error('CRITICAL: Failed to log system error to database:', err);
    console.error('Original Error:', error);
  }
}
