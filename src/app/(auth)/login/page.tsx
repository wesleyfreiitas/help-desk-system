'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>HelpDesk</h1>
          <p>Faça login para continuar, "admin@helpdesk.com", senha "123456"</p>
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
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              required 
              placeholder="Sua senha"
            />
          </div>

          {state?.error && <div className="error-message">{state.error}</div>}

          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
