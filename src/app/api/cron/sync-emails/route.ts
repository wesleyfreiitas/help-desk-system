import { NextResponse } from 'next/server';
import { processInboundEmails } from '@/lib/email-processor';

// Esta rota pode ser chamada por um serviço de Cron externo (Ex: Vercel Cron, GitHub Actions)
// Adicionando um segredo simples para evitar abusos se necessário, ou apenas deixando rodar
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  // Opcional: Validar uma chave secreta se estiver em produção
  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await processInboundEmails();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Também permitir POST para facilitar gatilhos
export async function POST(request: Request) {
  return GET(request);
}
