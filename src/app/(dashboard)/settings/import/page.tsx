import React from 'react';
import ImportClient from './ImportClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Importar Dados</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Faça upload de arquivos CSV para importar chamados legados e carregar o banco de dados.
        </p>
      </div>
      
      <ImportClient organizationId={session.orgId || session.clientId} />
    </div>
  );
}
