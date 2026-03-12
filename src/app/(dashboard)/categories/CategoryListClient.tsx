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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.25rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              outline: 'none',
              background: 'var(--bg-main)'
            }}
          />
        </div>
        
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete} 
            disabled={isDeleting}
            className="btn-primary" 
            style={{ width: 'auto', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
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
                checked={filteredCategories.length > 0 && selectedIds.size === filteredCategories.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th>Nome</th>
            <th>Chamados Vinculados</th>
            <th style={{ width: '60px', textAlign: 'center' }}>A\u00e7\u00f5es</th>
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

      {/* Edit Modal */}
      {editingCategory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-md)',
            width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Editar Categoria</h3>
              <button 
                onClick={() => setEditingCategory(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  Nome da Categoria
                </label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '1rem', outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
                  className="btn-outline"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSaving}
                  style={{ padding: '0.5rem 1rem', width: 'auto' }}
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
