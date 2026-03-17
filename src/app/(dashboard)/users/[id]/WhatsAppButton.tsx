'use client';

import { useState } from 'react';
import { Phone, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/app/actions/settings';

export default function WhatsAppButton({ phone, contactName }: { phone: string, contactName: string }) {
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
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={handleClick}
        className={`btn-outline-sm whatsapp-btn ${status}`}
        disabled={status === 'loading' || !phone}
        title={errorMessage || undefined}
      >
        {getButtonContent()}
      </button>

      <style jsx>{`
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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
