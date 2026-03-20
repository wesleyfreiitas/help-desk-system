'use client';

import { useState, useRef, useEffect } from 'react';
import { PhoneCall, Loader2, PhoneForwarded, PhoneOff } from 'lucide-react';
import { triggerClickToCall, getCallStatus, notifyCallEndWebhook } from '@/app/actions/upphone';
import { useToast } from '@/components/Toast';

export default function ClickToCallButton({ phone, ticketId }: { phone: string, ticketId?: string }) {
  const { error } = useToast();
  const [status, setStatus] = useState<'idle' | 'calling' | 'monitoring' | 'finished' | 'error'>('idle');
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  if (!phone) return null;

  const startMonitoring = (channelid: string) => {
    setStatus('monitoring');
    setCurrentChannelId(channelid);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await getCallStatus(channelid);
        
        if (result.end) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setStatus('finished');
          
          // Step 3: Notify Webhook
          await notifyCallEndWebhook(channelid, ticketId || "");
          
          // Reset to idle after a few seconds
          setTimeout(() => setStatus('idle'), 5000);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 2000);
  };

  const handleCall = async () => {
    if (status !== 'idle') return;
    
    setStatus('calling');
    try {
      const result = await triggerClickToCall(phone);
      
      const data = result.data;
      const channelid = data?.channelid || data?.UniqueID || data?.unique_id || data?.channel_id;
      
      if (!channelid) {
        // Mostrar o retorno real para ajudar no diagnóstico
        const responseStr = data ? JSON.stringify(data) : 'sem resposta';
        throw new Error(`Upphone: channelid não retornado. Resposta: ${responseStr}`);
      }

      startMonitoring(channelid);
    } catch (err: any) {
      error(err.message || 'Falha ao iniciar chamada');
      setStatus('idle');
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'calling': return <Loader2 size={14} className="animate-spin" />;
      case 'monitoring': return <PhoneForwarded size={14} />;
      case 'finished': return <PhoneOff size={14} />;
      case 'error': return <PhoneOff size={14} style={{ color: '#ef4444' }} />;
      default: return <PhoneCall size={14} />;
    }
  };

  return (
    <button 
      onClick={handleCall}
      disabled={status === 'calling' || status === 'monitoring'}
      className={`click-to-call-btn state-${status}`}
      title={status === 'monitoring' ? 'Ligação em curso...' : 'Ligar via Central Upphone'}
    >
      {getIcon()}
      
      <style jsx>{`
        .click-to-call-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.2);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        .click-to-call-btn:hover:not(:disabled) {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
        }
        .click-to-call-btn.state-monitoring {
          background: #22c55e;
          color: white;
          border-color: #16a34a;
          animation: pulse 2s infinite;
        }
        .click-to-call-btn.state-finished {
          background: #64748b;
          color: white;
          border-color: #475569;
        }
        .click-to-call-btn:disabled:not(.state-monitoring) {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
