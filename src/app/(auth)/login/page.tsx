'use client';

import { useActionState, useEffect, useState, Suspense, useRef } from 'react';
import { authenticate, autoLoginAction, checkSessionAction } from '@/app/actions/auth';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginContent() {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAutoLogging, setIsAutoLogging] = useState(false);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  
  // Ref para evitar loops e múltiplas chamadas simultâneas
  const loginAttemptInProgress = useRef(false);

  useEffect(() => {
    const userParam = searchParams.get('user');
    const companyParam = searchParams.get('company');

    if (userParam && companyParam && !loginAttemptInProgress.current) {
      const performAutoLogin = async () => {
        // Verifica se já não estamos logados antes de tentar
        const alreadyLogged = await checkSessionAction();
        if (alreadyLogged) {
          console.log('User already authenticated. Redirecting to dashboard...');
          router.push('/dashboard');
          return;
        }

        console.log('Starting auto-login process for:', userParam);
        loginAttemptInProgress.current = true;
        setIsAutoLogging(true);
        
        try {
          const result = await autoLoginAction(userParam, companyParam);
          // Se o autoLoginAction redirecionar no servidor (com redirect()), 
          // esta parte pode nem ser alcançada se for uma navegação completa.
          // Mas se ele retornar erro, tratamos aqui.
          if (result && result.error) {
            console.error('Auto-login failed:', result.error);
            setAutoLoginError(result.error);
            setIsAutoLogging(false);
            loginAttemptInProgress.current = false;
          }
        } catch (err) {
          console.error('Unexpected error during auto-login:', err);
          setAutoLoginError('Erro ao tentar realizar login automático.');
          setIsAutoLogging(false);
          loginAttemptInProgress.current = false;
        }
      };

      performAutoLogin();
    }
  }, [searchParams, router]);

  if (isAutoLogging) {
    return (
      <div className="login-container">
        <div className="login-box" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loader" style={{ margin: '0 auto 1.5rem auto' }}></div>
          <h2>Autenticando...</h2>
          <p>Validando acesso via Uppchannel</p>
          {autoLoginError && (
             <div className="error-message" style={{ marginTop: '1rem' }}>{autoLoginError}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img 
            src="https://suporte.absolutatelecom.com.br/arquivos/files/logo_u_black.png" 
            alt="Upp Logo" 
            style={{ height: '60px', width: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
          />
          <h1>Upp HelpDesk</h1>
          <p>Faça login para continuar</p>
        </div>
        
        <form action={formAction} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              required 
              placeholder="exemplo@empresa.com"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password">Senha</label>
              <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                Esqueceu a senha?
              </Link>
            </div>
            <input 
              type="password" 
              name="password" 
              id="password" 
              required 
              placeholder="Sua senha"
            />
          </div>

          {(state?.error || autoLoginError) && (
            <div className="error-message">{state?.error || autoLoginError}</div>
          )}

          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
