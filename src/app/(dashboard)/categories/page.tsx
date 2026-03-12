import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createCategory, deleteCategory } from '@/app/actions/admin';
import CategoryListClient from './CategoryListClient';

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') return null;

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tickets: true } } }
  });

  return (
    <div className="table-wrapper">
      <div className="table-header-filters">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Categorias de Chamados</h3>
      </div>

      {/* Formulário inline para criar categoria */}
      <form action={createCategory} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          type="text"
          name="name"
          placeholder="Nome da nova categoria"
          required
          style={{
            flex: 1,
            padding: '0.6rem 0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
          + Criar Categoria
        </button>
      </form>

      <CategoryListClient initialCategories={categories} />
    </div>
  );
}
