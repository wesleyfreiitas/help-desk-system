import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUser } from '@/app/actions/admin';
import Link from 'next/link';
import ClientSelector from './ClientSelector'; // Criaremos isso caso seja CLIENT

export default async function NewUserPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return null;

  const [clients, userFields] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.customField.findMany({ where: { target: 'USER' }, orderBy: { createdAt: 'asc' } })
  ]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Cadastrar Novo Usuário</h2>
        
        <form action={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="name">Nome Completo</label>
             <input type="text" id="name" name="name" required placeholder="Nome do usuário" />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="email">E-mail (Login)</label>
             <input type="email" id="email" name="email" required placeholder="email@exemplo.com" />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="phone">Telefone</label>
             <input type="text" id="phone" name="phone" placeholder="Ex: (11) 99999-9999" />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="password">Senha Inicial</label>
             <input type="password" id="password" name="password" placeholder="Defina uma senha ou deixe em branco se enviar e-mail" />
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Obrigatório se o e-mail de boas-vindas não for enviado.
             </p>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '12px', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-elevated)', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginTop: '-0.5rem'
          }}>
            <input 
              type="checkbox" 
              id="sendWelcomeEmail" 
              name="sendWelcomeEmail" 
              defaultChecked 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="sendWelcomeEmail" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)' }}>
                Enviar e-mail de boas-vindas
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                O usuário receberá um link para definir sua própria senha e ativar a conta.
              </p>
            </div>
          </div>

          {/* Usamos o Client Component ClientSelector para ocultar/mostrar o combo de clientes dependendo da role */}
          <ClientSelector clients={clients} />

          {userFields.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos Personalizados</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {userFields.map(field => (
                  <div key={field.id} className="form-group" style={{ gridColumn: field.type === 'TEXTAREA' ? '1 / span 2' : 'auto', marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{field.name}</label>
                    {field.type === 'BOOLEAN' ? (
                      <select name={`cf_${field.id}`} className="form-control">
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                      </select>
                    ) : field.type === 'SELECT' || field.type === 'MULTISELECT' ? (
                      <select name={`cf_${field.id}`} className="form-control" multiple={field.type === 'MULTISELECT'}>
                        <option value="">Selecione...</option>
                        {field.options?.split(',').map((opt: string) => (
                          <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                      </select>
                    ) : field.type === 'TEXTAREA' ? (
                      <textarea 
                        name={`cf_${field.id}`}
                        className="form-control"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        maxLength={300}
                      />
                    ) : (
                      <input 
                        type={field.type === 'NUMBER' ? 'number' : 'text'}
                        name={`cf_${field.id}`}
                        className="form-control"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
             <Link href="/users" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>Cancelar</Link>
             <button type="submit" className="btn-primary" style={{ width: '200px' }}>Salvar Usuário</button>
          </div>

        </form>
      </div>
    </div>
  );
}
