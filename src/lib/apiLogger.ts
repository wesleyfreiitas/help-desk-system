import fs from 'fs';
import path from 'path';

/**
 * Registra logs de chamadas para APIs externas.
 * Salva no arquivo logs/external_api.log na raiz do projeto.
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
    const logDir = path.join(process.cwd(), 'logs');
    
    // Garantir que a pasta logs existe
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'external_api.log');
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Mascarar tokens sensíveis no log se necessário
    let safeUrl = url;
    if (url.includes('token=')) {
      safeUrl = url.replace(/token=[^&]+/, 'token=***');
    }

    let safePayload = payload;
    if (payload && typeof payload === 'object') {
      safePayload = { ...payload };
      if (safePayload.token) safePayload.token = '***';
    }

    const logEntry = `[${timestamp}] ${service.toUpperCase()} | ${method} | ${safeUrl}
REQUEST: ${JSON.stringify(safePayload)}
STATUS: ${status}
RESPONSE: ${JSON.stringify(response)}
--------------------------------------------------------------------------------\n\n`;

    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    // Falha silenciosa no log para não quebrar a aplicação principal
    console.error('Failed to write to external_api.log:', err);
  }
}
