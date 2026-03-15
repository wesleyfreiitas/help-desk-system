'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Search, Edit, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductListClient({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Filter products based on search
  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} produto(s)?`)) return;

    try {
      setIsDeleting(true);
      const { bulkDeleteProducts } = await import('@/app/actions/admin');
      const ids = Array.from(selectedIds);
      await bulkDeleteProducts(ids);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir produtos');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editForm.name.trim()) return;

    try {
      setIsSaving(true);
      const { updateProduct } = await import('@/app/actions/admin');
      await updateProduct(editingProduct.id, {
        name: editForm.name.trim()
      });
      setEditingProduct(null);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar produto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="table-header-filters">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Buscar por nome do produto..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%' }}
          />
        </div>
        
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete} 
            disabled={isDeleting}
            style={{ 
              width: 'auto', 
              background: '#ef4444', 
              color: 'white', 
              border: '1px solid #dc2626', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              transition: 'background 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
            Excluir ({selectedIds.size})
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input 
                type="checkbox" 
                checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th>Nome do Produto</th>
            <th>Chamados Abertos</th>
            <th style={{ width: '60px', textAlign: 'center' }}>A\u00e7\u00f5es</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Nenhum produto encontrado.
              </td>
            </tr>
          ) : (
            filteredProducts.map((prod) => (
              <tr key={prod.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(prod.id)}
                    onChange={() => toggleSelect(prod.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>{prod.name}</td>
                <td>{prod._count.tickets}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => {
                      setEditingProduct(prod);
                      setEditForm({ name: prod.name });
                    }} 
                    className="btn-outline-sm" 
                    style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: '4px' }}
                    title="Editar Produto"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '100%', maxWidth: '500px' }}>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <h3>Editar Produto</h3>
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Produto *</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Nome do produto"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSaving}
                  style={{ width: 'auto' }}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
