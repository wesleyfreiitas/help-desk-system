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
  
  const loginAttemptInProgress = useRef(false);

  useEffect(() => {
    const userParam = searchParams.get('user');
    const companyParam = searchParams.get('company');

    if (userParam && companyParam && !loginAttemptInProgress.current) {
      console.log('✅ [SSO] Parâmetros detectados:', { user: userParam, company: companyParam });
      
      const performAutoLogin = async () => {
        try {
          console.log('🔎 [SSO] Verificando sessão existente...');
          const alreadyLogged = await checkSessionAction();
          
          if (alreadyLogged) {
            console.log('✨ [SSO] Usuário já autenticado. Pulando para o Dashboard.');
            router.replace('/dashboard');
            return;
          }

          console.log('🚀 [SSO] Iniciando chamada de auto-login no servidor...');
          loginAttemptInProgress.current = true;
          setIsAutoLogging(true);
          
          const result = await autoLoginAction(userParam, companyParam);
          console.log('📦 [SSO] Resposta do servidor recebida:', result);

          if (result && result.success) {
            console.log('🎉 [SSO] Sucesso! Verificando se o cookie foi aceito...');
            
            // Pequeno delay para garantir que o navegador processou o cookie
            setTimeout(async () => {
              const checkCookie = await checkSessionAction();
              if (!checkCookie) {
                console.error('🚫 [SSO] Cookie de sessão BLOQUEADO pelo navegador (provavelmente política de Iframe/Cookies de terceiros).');
                setAutoLoginError('Seu navegador está bloqueando cookies de terceiros. Por favor, habilite-os para usar o sistema embedado.');
                setIsAutoLogging(false);
                loginAttemptInProgress.current = false;
              } else {
                console.log('✅ [SSO] Cookie confirmado. Redirecionando...');
                window.location.replace('/dashboard');
              }
            }, 500);
            return;
          }

          if (result && result.error) {
            console.error('❌ [SSO] Erro retornado pela Action:', result.error);
            setAutoLoginError(result.error);
            setIsAutoLogging(false);
            loginAttemptInProgress.current = false;
          }
        } catch (err: any) {
          console.error('💥 [SSO] Erro inesperado no fluxo:', err);
          if (err.message !== 'NEXT_REDIRECT') {
            setAutoLoginError('Falha técnica no login automático. Verifique o console.');
            setIsAutoLogging(false);
            loginAttemptInProgress.current = false;
          }
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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Isso pode levar alguns segundos dependendo da conexão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header" style={{ textAlign: 'center' }}>
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
            <div className="error-message" style={{ 
              background: '#fee2e2', 
              color: '#991b1b', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              fontSize: '0.85rem',
              border: '1px solid #fecaca'
            }}>
              {state?.error || autoLoginError}
              {autoLoginError?.includes('cookies') && (
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  Dica: Tente acessar fora do iframe ou habilite "Cookies de terceiros" nas configurações do Chrome.
                </div>
              )}
            </div>
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
