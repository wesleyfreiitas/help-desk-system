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
  toasts: NotificationEvent[];
  unreadCount: number;
  removeNotification: (id: string) => void;
  removeToast: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [toasts, setToasts] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar do sessionStorage no mount
  useEffect(() => {
    const savedNotifications = sessionStorage.getItem('notifications_history');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (e) {
        console.error('Erro ao carregar notificações do cache');
      }
    }

    const savedCount = sessionStorage.getItem('notifications_unread_count');
    if (savedCount) {
      setUnreadCount(parseInt(savedCount, 10) || 0);
    }

    // Inicializar o lastCheck com o momento do carregamento
    lastCheckRef.current = new Date();
    
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const checkNotifications = async () => {
      try {
        if (!lastCheckRef.current) return;

        const since = lastCheckRef.current.toISOString();
        const requestTime = new Date(); // Guardar o tempo exato da requisição
        
        const response = await fetch(`/api/notifications/check?since=${since}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
          // Atualizar o tempo do último check para o tempo da requisição bem sucedida
          // Isso evita "gaps" de milisegundos entre polls
          lastCheckRef.current = requestTime;

          const newEvents = data.events.filter((e: any) => !notifications.some(p => p.id === e.id));

          if (newEvents.length > 0) {
            audioRef.current?.play().catch(() => {});
            
            // Atualizar contador de não lidos separadamente para garantir consistência
            setUnreadCount(count => {
              const newCount = count + newEvents.length;
              sessionStorage.setItem('notifications_unread_count', newCount.toString());
              return newCount;
            });

            // Atualizar histórico de notificações (sino)
            setNotifications(prev => {
              const updatedNotifications = [...newEvents, ...prev].slice(0, 20);
              sessionStorage.setItem('notifications_history', JSON.stringify(updatedNotifications));
              return updatedNotifications;
            });

            // Adicionar aos toasts (popups temporários)
            setToasts(prev => [...newEvents, ...prev]);
          }
        } else {
          // Se não houver eventos, ainda assim atualizamos o tempo para o momento da requisição
          lastCheckRef.current = requestTime;
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    const interval = setInterval(checkNotifications, 15000); // Reduzido para 15s para mais agilidade
    checkNotifications();

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      sessionStorage.setItem('notifications_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    sessionStorage.setItem('notifications_unread_count', '0');
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      toasts, 
      unreadCount, 
      removeNotification, 
      removeToast, 
      markAllAsRead 
    }}>
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
