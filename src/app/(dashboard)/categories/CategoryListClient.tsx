'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Search, Edit, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CategoryListClient({ initialCategories }: { initialCategories: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Filter categories based on search
  const filteredCategories = initialCategories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCategories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCategories.map(c => c.id)));
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
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} categoria(s)?`)) return;

    try {
      setIsDeleting(true);
      const { bulkDeleteCategories } = await import('@/app/actions/admin');
      const ids = Array.from(selectedIds);
      await bulkDeleteCategories(ids);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir categorias');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    try {
      setIsSaving(true);
      const { updateCategory } = await import('@/app/actions/admin');
      await updateCategory(editingCategory.id, editName.trim());
      setEditingCategory(null);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar categoria');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="table-header-filters" style={{ borderTop: '1px solid var(--border-color)', marginTop: '0' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Buscar por nome..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%' }}
          />
        </div>
        
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete} 
            disabled={isDeleting}
            className="btn-danger-soft" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer',
              background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            <Trash2 size={16} />
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
                checked={filteredCategories.length > 0 && selectedIds.size === filteredCategories.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th>Nome</th>
            <th>Chamados Vinculados</th>
            <th style={{ width: '60px', textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Nenhuma categoria encontrada.
              </td>
            </tr>
          ) : (
            filteredCategories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(cat.id)}
                    onChange={() => toggleSelect(cat.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>{cat.name}</td>
                <td>{cat._count.tickets}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => {
                      setEditingCategory(cat);
                      setEditName(cat.name);
                    }} 
                    className="btn-outline-sm" 
                    style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: '4px' }}
                    title="Editar Categoria"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Editar Categoria</h3>
              <button className="modal-close" onClick={() => setEditingCategory(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Nome da Categoria</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
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
