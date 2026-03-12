import { getSession } from '@/lib/auth';
import { getCustomFields } from '@/app/actions/customFields';
import NewClientForm from './NewClientForm';

export default async function NewClientPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') return null;

  const customFields = await getCustomFields();

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ background: 'var(--surface)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>Cadastrar Nova Empresa</h2>
        <NewClientForm customFields={customFields} />
      </div>
    </div>
  );
}
