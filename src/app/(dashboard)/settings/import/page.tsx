import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportClient from './ImportClient';

export default async function ImportPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') {
    redirect('/dashboard');
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Importação de Dados
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Importe sua base de empresas e clientes de forma massiva através de colagem de dados.
        </p>
      </div>

      <ImportClient />
    </div>
  );
}
