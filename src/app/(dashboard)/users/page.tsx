import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import UserListClient from './UserListClient';

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return null;

  const [users, clients] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: { client: true }
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <div className="table-wrapper">
      <div className="table-header-filters">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Usuários e Membros</h3>
        <Link href="/users/new" className="btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>+ Novo Usuário</Link>
      </div>

      <UserListClient initialUsers={users} currentUserId={session.user.id} clients={clients} />
    </div>
  );
}
