import { NextResponse } from 'next/server';
import { logSystemError } from '@/lib/apiLogger';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { error, url, digest } = data;

    await logSystemError('CLIENT_ERROR', { 
      message: error?.message || 'Error sem mensagem', 
      stack: error?.stack || 'Sem stack trace',
      digest 
    }, { url });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
