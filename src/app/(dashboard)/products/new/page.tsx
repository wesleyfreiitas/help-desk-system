import { getSession } from '@/lib/auth';
import { createProduct } from '@/app/actions/admin';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function NewProductPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') return null;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Cadastrar Novo Produto</h2>
        
        <form action={createProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="name">Nome do Produto</label>
             <input type="text" id="name" name="name" required placeholder="Ex: Sistema ERP" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
             <Link href="/products" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>Cancelar</Link>
             <button type="submit" className="btn-primary" style={{ width: '200px' }}>Salvar Produto</button>
          </div>

        </form>
      </div>
    </div>
  );
}
