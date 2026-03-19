import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createDepartment } from '@/app/actions/departments';
import Link from 'next/link';

export default async function NewDepartmentPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return redirect('/tickets');

  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    if (!name?.trim()) throw new Error('Nome é obrigatório');
    await createDepartment({ name, description, color });
    redirect('/departments');
  }

  const colorOptions = [
    { label: 'Índigo', value: '#6366f1' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Verde', value: '#22c55e' },
    { label: 'Amarelo', value: '#eab308' },
    { label: 'Laranja', value: '#f97316' },
    { label: 'Vermelho', value: '#ef4444' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Roxo', value: '#a855f7' },
  ];

  return (
    <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.75rem' }}>Novo Departamento</h2>

        <form action={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nome do Departamento *</label>
            <input type="text" name="name" required placeholder="Ex: Suporte, TI, Financeiro..." className="form-control" />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Descrição</label>
            <textarea name="description" placeholder="Descreva a responsabilidade deste departamento..." className="form-control" style={{ minHeight: '90px', resize: 'vertical' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cor de Identificação</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colorOptions.map(c => (
                <label key={c.value} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <input type="radio" name="color" value={c.value} defaultChecked={c.value === '#6366f1'} style={{ accentColor: c.value }} />
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.value, display: 'inline-block' }} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Link href="/departments" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>Cancelar</Link>
            <button type="submit" className="btn-primary">Criar Departamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}
