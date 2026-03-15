'use client';

import { useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPasswordAction } from '@/app/actions/auth';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, formAction, isPending] = useActionState(resetPasswordAction, undefined);

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
          <p>Link de recuperação inválido ou ausente.</p>
        </div>
        <Link href="/forgot-password" title="Solicitar novo link" className="btn-primary">Solicitar Novo Link</Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={24} style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
          <p>{state.success}</p>
        </div>
        <Link href="/login" className="btn-primary">Ir para o Login</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="token" value={token} />
      
      <div className="form-group">
        <label htmlFor="password">Nova Senha</label>
        <div style={{ position: 'relative' }}>
          <input 
            type="password" 
            name="password" 
            id="password" 
            required 
            placeholder="Mínimo 6 caracteres"
            style={{ paddingLeft: '2.5rem' }}
          />
          <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
        <div style={{ position: 'relative' }}>
          <input 
            type="password" 
            name="confirmPassword" 
            id="confirmPassword" 
            required 
            placeholder="Repita a nova senha"
            style={{ paddingLeft: '2.5rem' }}
          />
          <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {state?.error && <div className="error-message">{state.error}</div>}

      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? 'Alterando Senha...' : 'Redefinir Senha'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img 
            src="https://suporte.absolutatelecom.com.br/arquivos/files/logo_u_black.png" 
            alt="Upp Logo" 
            style={{ height: '60px', width: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
          />
          <h1>Nova Senha</h1>
          <p>Defina sua nova credencial de acesso</p>
        </div>
        
        <Suspense fallback={<div style={{ textAlign: 'center' }}>Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
