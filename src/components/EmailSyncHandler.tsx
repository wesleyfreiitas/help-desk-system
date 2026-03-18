'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailSyncHandler() {
  const router = useRouter();

  useEffect(() => {
    // Sincronização inicial
    const syncEmails = async () => {
      try {
        const res = await fetch('/api/cron/sync-emails', { method: 'POST' });
        if (res.ok) {
          // Se houve novos emails processados, podemos forçar um refresh da página atual
          // para mostrar os dados novos se o usuário estiver em uma lista ou no chamado.
          router.refresh();
        }
      } catch (error) {
        console.error('Erro na sincronização automática de e-mails:', error);
      }
    };

    // Agendar a primeira execução para alguns segundos após o carregamento
    const initialTimeout = setTimeout(syncEmails, 5000);

    // Configurar intervalo (ex: a cada 5 minutos)
    const interval = setInterval(syncEmails, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [router]);

  // Este componente não renderiza nada visualmente
  return null;
}
