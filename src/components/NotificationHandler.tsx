'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationEvent {
  id: string;
  ticketId: string;
  protocol: string;
  title: string;
  type: 'NEW_TICKET' | 'TICKET_REOPENED';
}

export default function NotificationHandler() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const lastCheckRef = useRef<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializar som de notificação (usando um som padrão do sistema ou URL externa confiável)
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const checkNotifications = async () => {
      try {
        const since = lastCheckRef.current.toISOString();
        const response = await fetch(`/api/notifications/check?since=${since}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
          // Filtrar duplicados que já podem estar na lista
          setNotifications(prev => {
            const newEvents = data.events.filter((e: any) => !prev.some(p => p.id === e.id));
            if (newEvents.length > 0) {
              // Tocar som
              audioRef.current?.play().catch(() => {});
              return [...newEvents, ...prev].slice(0, 5); // Manter apenas as últimas 5
            }
            return prev;
          });
        }
        
        lastCheckRef.current = new Date();
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Checar a cada 30 segundos
    const interval = setInterval(checkNotifications, 30000);
    
    // Checagem inicial imediata (mas marcando o tempo agora)
    checkNotifications();

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '350px'
    }}>
      {notifications.map(n => (
        <div key={n.id} className="notification-toast" style={{
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          gap: '1rem',
          animation: 'notification-slide-in 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Progress bar for auto-close */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: n.type === 'NEW_TICKET' ? 'var(--primary)' : '#f59e0b',
            animation: 'notification-progress 10s linear forwards'
          }} onAnimationEnd={() => removeNotification(n.id)} />

          <div style={{
            background: n.type === 'NEW_TICKET' ? '#eff6ff' : '#fffbeb',
            color: n.type === 'NEW_TICKET' ? '#2563eb' : '#d97706',
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'fit-content'
          }}>
            <Bell size={20} />
          </div>

          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>
              {n.type === 'NEW_TICKET' ? 'Novo Chamado Criado' : 'Chamado Reaberto'}
            </h5>
            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              #{n.protocol} - {n.title.length > 40 ? n.title.substring(0, 40) + '...' : n.title}
            </p>
            <a href={`/tickets/${n.ticketId}`} className="nt-link" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Visualizar Chamado
            </a>
          </div>

          <button 
            onClick={() => removeNotification(n.id)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '2px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <style jsx global>{`
        @keyframes notification-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes notification-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .notification-toast:hover {
          transform: translateY(-2px);
          transition: transform 0.2s;
        }
      `}</style>
    </div>
  );
}
