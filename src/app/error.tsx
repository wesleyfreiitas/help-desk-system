'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para console (local)
    console.error('Root Error Boundary:', error);

    // Enviar para o Log Persistente no Banco de Dados
    fetch('/api/system/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
        },
        url: typeof window !== 'undefined' ? window.location.href : '',
        digest: error.digest,
      }),
    }).catch(err => console.error('Failed to report error to system logs:', err));
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">
          <AlertTriangle size={48} />
        </div>
        <h2 className="error-title">Oops! Algo deu errado</h2>
        <p className="error-message">
          Ocorreu um erro inesperado ao carregar esta página. 
          {process.env.NODE_ENV === 'development' && (
            <span className="error-debug">[{error.message}]</span>
          )}
        </p>
        
        <div className="error-actions">
          <button onClick={() => reset()} className="btn-retry">
            <RefreshCcw size={18} /> Tentar novamente
          </button>
          <Link href="/" className="btn-home">
            <Home size={18} /> Voltar ao Início
          </Link>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-main);
          padding: 2rem;
        }
        .error-card {
          background: var(--bg-card);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
          animation: fade-up 0.4s ease-out;
        }
        .error-icon {
          color: #ef4444;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        .error-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1rem;
        }
        .error-message {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .error-debug {
          display: block;
          font-family: monospace;
          background: #fee2e2;
          color: #991b1b;
          padding: 0.5rem;
          border-radius: 6px;
          margin-top: 1rem;
          font-size: 0.75rem;
        }
        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .btn-retry, .btn-home {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-retry {
          background: #6366f1;
          color: white;
          border: none;
        }
        .btn-retry:hover { background: #4f46e5; }
        .btn-home {
          background: transparent;
          color: var(--text-main);
          border: 1px solid var(--border-color);
        }
        .btn-home:hover { background: var(--bg-elevated); }

        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
