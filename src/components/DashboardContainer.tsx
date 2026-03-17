'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardContainer({ user, children }: { user: any, children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-layout">
      <Sidebar user={user} isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className="main-content">
        <Header user={user} onMenuClick={toggleSidebar} />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
