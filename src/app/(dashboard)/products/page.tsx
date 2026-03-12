import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import ProductListClient from './ProductListClient';

export default async function ProductsPage() {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') return null;

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tickets: true } } }
  });

  return (
    <div className="table-wrapper">
      <div className="table-header-filters">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Catálogo de Produtos</h3>
        <Link href="/products/new" className="btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>+ Novo Produto</Link>
      </div>

      <ProductListClient initialProducts={products} />
    </div>
  );
}
