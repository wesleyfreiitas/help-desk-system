'use client';

import { useActionState } from 'react';
import { updateProfileAction, updatePasswordAction } from '@/app/actions/auth';
import { Lock, Save, User as UserIcon, Shield, Phone, Hash } from 'lucide-react';

export default function ProfileClient({ user }: { user: any }) {
  const [profileState, profileFormAction, isProfilePending] = useActionState(updateProfileAction, undefined);
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(updatePasswordAction, undefined);

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Meu Perfil</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie suas informações pessoais e de segurança.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Profile Info Section */}
        <div className="table-wrapper" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <UserIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Dados Pessoais</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Suas informações de contato</p>
            </div>
          </div>

          <form action={profileFormAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="name" style={{ fontWeight: 600 }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  defaultValue={user.name}
                  required 
                  style={{ paddingLeft: '2.5rem' }}
                />
                <UserIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone" style={{ fontWeight: 600 }}>Telefone</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="phone" 
                  id="phone" 
                  defaultValue={user.phone || ''}
                  placeholder="(00) 00000-0000"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {['ADMIN', 'ATTENDANT'].includes(user.role) && (
              <div className="form-group">
                <label htmlFor="extension" style={{ fontWeight: 600 }}>Ramal (Upphone)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="extension" 
                    id="extension" 
                    defaultValue={user.extension || ''}
                    placeholder="Ex: 5001"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Hash size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            )}

            {profileState?.error && (
              <div className="alert-error" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {profileState.error}
              </div>
            )}

            {profileState?.success && (
              <div className="alert-success" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {profileState.success}
              </div>
            )}

            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={isProfilePending} style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {isProfilePending ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password Section */}
        <div className="table-wrapper" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ 
              background: '#f59e0b', 
              color: 'white', 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Segurança</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Alterar sua senha de acesso</p>
            </div>
          </div>

          <form action={passwordFormAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="currentPassword" style={{ fontWeight: 600 }}>Senha Atual</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  name="currentPassword" 
                  id="currentPassword" 
                  required 
                  placeholder="Sua senha atual"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Shield size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" style={{ fontWeight: 600 }}>Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  name="newPassword" 
                  id="newPassword" 
                  required 
                  placeholder="Mín. 6 caracteres"
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
                  placeholder="Repita a senha"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {passwordState?.error && (
              <div className="alert-error" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {passwordState.error}
              </div>
            )}

            {passwordState?.success && (
              <div className="alert-success" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {passwordState.success}
              </div>
            )}

            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={isPasswordPending} style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} />
                {isPasswordPending ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx>{`
        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fee2e2;
        }
        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #d1fae5;
        }
      `}</style>
    </div>
  );
}
