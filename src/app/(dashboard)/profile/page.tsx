'use client';

import { useActionState } from 'react';
import { updatePasswordAction } from '@/app/actions/auth';
import { Lock, Save, User as UserIcon, Shield } from 'lucide-react';

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, undefined);

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Meu Perfil</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie suas informações de segurança e alterne sua senha.</p>
      </div>

      <div className="table-wrapper" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <UserIcon size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Segurança da Conta</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Mantenha sua senha sempre atualizada</p>
          </div>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="currentPassword" style={{ fontWeight: 600 }}>Senha Atual</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                name="currentPassword" 
                id="currentPassword" 
                required 
                placeholder="Digite sua senha atual"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Shield size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="newPassword" style={{ fontWeight: 600 }}>Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  name="newPassword" 
                  id="newPassword" 
                  required 
                  placeholder="Mínimo 6 caracteres"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" style={{ fontWeight: 600 }}>Confirmar Nova Senha</label>
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
          </div>

          {state?.error && (
            <div style={{ 
              background: '#fef2f2', 
              color: '#991b1b', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {state.error}
            </div>
          )}

          {state?.success && (
            <div style={{ 
              background: '#ecfdf5', 
              color: '#065f46', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {state.success}
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={isPending} style={{ width: 'auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} />
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
