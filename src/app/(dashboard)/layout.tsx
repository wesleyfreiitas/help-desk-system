import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
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
      <div className="app-layout">
        <Sidebar user={session.user} />
        <NotificationHandler />
        
        <main className="main-content">
          <Header user={session.user} />
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}
