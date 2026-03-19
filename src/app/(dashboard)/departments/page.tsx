import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDepartments } from '@/app/actions/departments';
import Link from 'next/link';
import { Plus, Users, Ticket, Settings } from 'lucide-react';

export default async function DepartmentsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return redirect('/tickets');

  const departments = await getDepartments();

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Departamentos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Gerencie os setores da sua organização.
          </p>
        </div>
        <Link href="/departments/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '0.7rem 1.4rem' }}>
          <Plus size={16} /> Novo Departamento
        </Link>
      </div>

      {departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 8px', fontWeight: 500 }}>Nenhum departamento criado</h3>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Crie seu primeiro departamento para organizar sua equipe de atendimento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/departments/${dept.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
                borderLeft: `4px solid ${dept.color || '#6366f1'}`,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{dept.name}</h3>
                    {dept.description && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{dept.description}</p>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px',
                    borderRadius: '999px', backgroundColor: dept.active ? '#dcfce7' : '#fee2e2',
                    color: dept.active ? '#166534' : '#991b1b'
                  }}>
                    {dept.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Users size={14} />
                    <span><strong style={{ color: 'var(--text-main)' }}>{dept._count.members}</strong> agentes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Ticket size={14} />
                    <span><strong style={{ color: 'var(--text-main)' }}>{dept._count.tickets}</strong> chamados</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
