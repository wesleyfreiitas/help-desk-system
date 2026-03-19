'use client';

import { useState } from 'react';
import { PhoneCall, Loader2 } from 'lucide-react';
import { triggerClickToCall } from '@/app/actions/upphone';

export default function ClickToCallButton({ phone }: { phone: string }) {
  const [loading, setLoading] = useState(false);

  if (!phone) return null;

  const handleCall = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await triggerClickToCall(phone);
      // Optional: Show a subtle toast or message
    } catch (error: any) {
      alert(error.message || 'Falha ao iniciar chamada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCall}
      disabled={loading}
      className="click-to-call-btn"
      title="Ligar via Central Upphone"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
      
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
        .click-to-call-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
