'use client';

import { useState } from 'react';
import { Phone, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/app/actions/settings';

export default function WhatsAppButton({ 
  phone, 
  contactName, 
  isFloating = false 
}: { 
  phone: string, 
  contactName: string,
  isFloating?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClick = async () => {
    if (!phone) {
      alert('Este contato não possui telefone cadastrado.');
      return;
    }

    if (status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await sendWhatsAppMessage(phone, contactName);

      if (result.success && result.data) {
        let sessionId = result.data.sessionId;
        const messageId = result.data.id;

        // Se o sessionId não veio na resposta imediata, fazemos polling
        if (!sessionId && messageId) {
          const { getWhatsAppMessageStatus } = await import('@/app/actions/settings');

          let attempts = 0;
          const maxAttempts = 5; // Tenta por 5 segundos

          while (!sessionId && attempts < maxAttempts) {
            attempts++;
            // Espera 1 segundo
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
              const statusData = await getWhatsAppMessageStatus(messageId);
              if (statusData.sessionId) {
                sessionId = statusData.sessionId;
                break;
              }
            } catch (e) {
              console.warn('Tentativa de status falhou:', e);
            }
          }
        }

        if (sessionId) {
          setStatus('success');
          // Redirecionar para a sessão
          window.open(`https://app.uppchannel.com.br/chat2/sessions/${sessionId}`, '_blank');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          // Se mesmo após polling não temos sessionId, marcamos sucesso mas sem redirect
          setStatus('success');
          setTimeout(() => setStatus('idle'), 3000);
        }
      }
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao enviar WhatsApp');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    if (isFloating) {
      switch (status) {
        case 'loading':
          return <RefreshCw size={24} className="animate-spin" />;
        case 'success':
          return <Check size={24} />;
        case 'error':
          return <AlertCircle size={24} />;
        default:
          return <Phone size={24} fill="currentColor" />;
      }
    }

    switch (status) {
      case 'loading':
        return <><RefreshCw size={14} className="animate-spin" /> Enviando...</>;
      case 'success':
        return <><Check size={14} /> Enviado!</>;
      case 'error':
        return <><AlertCircle size={14} /> Falhou</>;
      default:
        return <><Phone size={14} /> WhatsApp</>;
    }
  };

  return (
    <div className={isFloating ? "whatsapp-fab-container" : "whatsapp-inline-container"}>
      <button
        onClick={handleClick}
        className={isFloating ? `whatsapp-fab ${status}` : `btn-outline-sm whatsapp-btn ${status}`}
        disabled={status === 'loading' || !phone}
        title={isFloating ? "Falar no WhatsApp" : (errorMessage || undefined)}
      >
        {getButtonContent()}
      </button>

      <style jsx>{`
        .whatsapp-inline-container {
          position: relative;
          display: inline-block;
        }
        .whatsapp-btn.success {
          background-color: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }
        .whatsapp-btn.error {
          background-color: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        /* Floating Button Layout */
        .whatsapp-fab-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: none; /* Hidden by default on desktop */
        }

        .whatsapp-fab {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: #25d366;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .whatsapp-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .whatsapp-fab:active {
          transform: scale(0.95);
        }

        .whatsapp-fab:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .whatsapp-fab.loading {
          background-color: #e2e8f0;
          color: #64748b;
        }

        .whatsapp-fab.success {
          background-color: #dcfce7;
          color: #166534;
        }

        .whatsapp-fab.error {
          background-color: #fef2f2;
          color: #991b1b;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .whatsapp-fab-container {
            display: block; /* Show only on mobile */
          }
        }
      `}</style>
    </div>
  );
}
