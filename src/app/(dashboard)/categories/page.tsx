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
      <div className="table-header-filters" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Categorias de Chamados</h3>
        </div>

        {/* Formulário inline para criar categoria */}
        <form action={createCategory} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <input
            type="text"
            name="name"
            className="search-input"
            placeholder="Nome da nova categoria"
            required
            style={{ flex: 1, paddingLeft: '1rem' }}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
            + Criar Categoria
          </button>
        </form>
      </div>

      <CategoryListClient initialCategories={categories} />
    </div>
  );
}
