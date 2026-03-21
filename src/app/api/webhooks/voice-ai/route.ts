import { NextResponse } from 'next/server';
import { handleTicketEvent, WebhookPayload } from '@/lib/webhookHandler';

/**
 * Endpoint consolidado para eventos de voz e ações automáticas.
 * Aceita 'source': 'AI' (padrão) ou 'SYSTEM'.
 */
export async function POST(req: Request) {
  try {
    const body: WebhookPayload = await req.json();
    
    // Se o usuário não enviou source, o padrão para este endpoint é 'AI'
    // Mas se enviou explicitamente (ex: 'SYSTEM'), nós respeitamos.
    const payload: WebhookPayload = {
      source: 'AI', // Default
      ...body
    };

    const result = await handleTicketEvent(payload, req.url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
