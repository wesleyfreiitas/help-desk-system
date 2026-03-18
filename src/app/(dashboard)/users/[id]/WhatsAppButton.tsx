'use client';

import { useState } from 'react';
import { Phone, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/app/actions/settings';

export default function WhatsAppButton({ 
  phone, 
  contactName 
}: { 
  phone: string, 
  contactName: string
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

      if (result.success) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
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
        return <RefreshCw size={16} className="animate-spin" />;
      case 'success':
        return <Check size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        // Using a more recognizable green color for the WhatsApp icon handle
        return <Phone size={16} />;
    }
  };

  const getButtonTitle = () => {
    if (status === 'loading') return 'Enviando...';
    if (status === 'success') return 'Mensagem enviada!';
    if (status === 'error') return errorMessage || 'Erro ao enviar';
    return `Falar com ${contactName} no WhatsApp`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}>
      <button
        onClick={handleClick}
        className={`whatsapp-icon-btn ${status}`}
        disabled={status === 'loading' || !phone}
        title={getButtonTitle()}
      >
        {getButtonContent()}
      </button>

      <style jsx>{`
        .whatsapp-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #25d366;
          background: transparent;
          color: #25d366;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .whatsapp-icon-btn:hover:not(:disabled) {
          background-color: #25d366;
          color: white;
        }

        .whatsapp-icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: var(--border-color);
          color: var(--text-muted);
        }

        .whatsapp-icon-btn.loading {
          border-color: var(--primary);
          color: var(--primary);
        }

        .whatsapp-icon-btn.success {
          background-color: #25d366;
          color: white;
          border-color: #25d366;
        }

        .whatsapp-icon-btn.error {
          background-color: #fee2e2;
          color: #dc2626;
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
