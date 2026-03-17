import { ReactNode } from 'react';
import DashboardContainer from '@/components/DashboardContainer';
import NotificationHandler from '@/components/NotificationHandler';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NotificationProvider } from '@/components/NotificationProvider';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <NotificationProvider>
      <DashboardContainer user={session.user}>
        <NotificationHandler />
        {children}
      </DashboardContainer>
    </NotificationProvider>
  );
}
