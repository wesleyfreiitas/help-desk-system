import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import EmpresaListClient from './EmpresaListClient';

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') return null;

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tickets: true, users: true } } }
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestão de Empresas</h2>
        <Link href="/companies/new" className="btn-primary" style={{ width: 'auto' }}>
          + Nova Empresa
        </Link>
      </div>
      
      <div className="table-wrapper">
        <EmpresaListClient initialClients={clients} />
      </div>
    </div>
  );
}
