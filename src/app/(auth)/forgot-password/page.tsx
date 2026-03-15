'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from '@/app/actions/auth';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, undefined);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img 
            src="https://suporte.absolutatelecom.com.br/arquivos/files/logo_u_black.png" 
            alt="Upp Logo" 
            style={{ height: '60px', width: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
          />
          <h1>Recuperar Senha</h1>
          <p>Informe seu e-mail para receber as instruções</p>
        </div>
        
        {state?.success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              background: '#ecfdf5', 
              color: '#065f46', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              {state.success}
            </div>
            <Link href="/login" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        ) : (
          <form action={formAction} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail de Cadastro</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  required 
                  placeholder="exemplo@empresa.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {state?.error && <div className="error-message">{state.error}</div>}

            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                Lembrou a senha? Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
