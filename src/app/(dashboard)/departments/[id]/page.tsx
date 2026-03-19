import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDepartmentDetails, getDepartments } from '@/app/actions/departments';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import DepartmentManager from './DepartmentManager';

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return redirect('/tickets');

  const { id } = await params;
  const [dept, allAgents] = await Promise.all([
    getDepartmentDetails(id),
    prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ATTENDANT'] }, deletedAt: null },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!dept) return <div style={{ padding: '2rem' }}>Departamento não encontrado.</div>;

  const memberIds = dept.members.map(m => m.userId);
  const nonMembers = allAgents.filter(u => !memberIds.includes(u.id));

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Link href="/departments" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> Voltar para Departamentos
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', borderLeft: `4px solid ${dept.color || '#6366f1'}`, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{dept.name}</h1>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px',
                borderRadius: '999px', backgroundColor: dept.active ? '#dcfce7' : '#fee2e2',
                color: dept.active ? '#166534' : '#991b1b'
              }}>{dept.active ? 'Ativo' : 'Inativo'}</span>
            </div>
            {dept.description && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{dept.description}</p>}
          </div>

          {/* Recent Tickets */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Chamados Recentes ({dept.tickets.length})
            </h3>
            {dept.tickets.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.875rem' }}>Nenhum chamado neste departamento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dept.tickets.map(t => (
                  <Link key={t.id} href={`/tickets/${t.id}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', transition: 'background 0.15s' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{t.title}</span>
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{t.protocol}</span>
                      {t.requester && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>· {t.requester.name}</span>}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: 'var(--border-color)', color: 'var(--text-muted)' }}>{t.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <DepartmentManager department={dept} nonMembers={nonMembers} />
      </div>
    </div>
  );
}
