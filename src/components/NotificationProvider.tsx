'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface NotificationEvent {
  id: string;
  ticketId: string;
  protocol: string;
  title: string;
  type: 'NEW_TICKET' | 'TICKET_REOPENED';
}

interface NotificationContextType {
  notifications: NotificationEvent[];
  unreadCount: number;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const checkNotifications = async () => {
      try {
        const since = lastCheckRef.current.toISOString();
        const response = await fetch(`/api/notifications/check?since=${since}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
          setNotifications(prev => {
            const newEvents = data.events.filter((e: any) => !prev.some(p => p.id === e.id));
            if (newEvents.length > 0) {
              audioRef.current?.play().catch(() => {});
              setUnreadCount(count => count + newEvents.length);
              return [...newEvents, ...prev].slice(0, 20); // Armazenar até 20 para o histórico
            }
            return prev;
          });
        }
        
        lastCheckRef.current = new Date();
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    const interval = setInterval(checkNotifications, 30000);
    checkNotifications();

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, removeNotification, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
