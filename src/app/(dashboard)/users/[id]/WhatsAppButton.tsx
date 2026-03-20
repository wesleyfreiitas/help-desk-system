'use client';

import { useState } from 'react';
import { Phone, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { sendWhatsAppMessage } from '@/app/actions/settings';
import { useToast } from '@/components/Toast';

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Alternativa: SVG real do logo do WhatsApp
const WhatsAppLogo = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.399-4.52 9.885-9.896 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function WhatsAppButton({ 
  phone, 
  contactName 
}: { 
  phone: string, 
  contactName: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { error } = useToast();

  const handleClick = async () => {
    if (!phone) {
      error('Este contato não possui telefone cadastrado.');
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
        // Using the authentic WhatsApp Logo
        return <WhatsAppLogo size={18} />;
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
