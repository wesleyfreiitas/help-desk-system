'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import Link from 'next/link';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={handleToggle}
        className="bell-button"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          color: isOpen ? 'var(--primary)' : 'var(--text-color)'
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '10px',
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Notificações</h4>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Limpar tudo
              </button>
            )}
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '0.75rem',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    background: n.type === 'NEW_TICKET' ? '#eff6ff' : '#fffbeb',
                    color: n.type === 'NEW_TICKET' ? '#2563eb' : '#d97706',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bell size={18} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>
                      {n.type === 'NEW_TICKET' ? 'Novo Chamado' : 'Chamado Reaberto'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      #{n.protocol} - {n.title}
                    </p>
                    <Link 
                      href={`/tickets/${n.ticketId}`} 
                      onClick={() => setIsOpen(false)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '0.75rem', 
                        color: 'var(--primary)', 
                        fontWeight: 600, 
                        marginTop: '4px',
                        textDecoration: 'none'
                      }}
                    >
                      Ver detalhes <ExternalLink size={12} />
                    </Link>
                  </div>

                  <button 
                    onClick={() => removeNotification(n.id)}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', position: 'absolute', top: '10px', right: '10px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '0.75rem', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
            <Link href="/tickets" onClick={() => setIsOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
              Ver todos os chamados
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .bell-button:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
