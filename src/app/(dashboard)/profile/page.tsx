import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await (prisma.user as any).findUnique({
    where: { id: session.user.id }
  });

  if (!user) redirect('/login');

  return <ProfileClient user={JSON.parse(JSON.stringify(user))} />;
}
