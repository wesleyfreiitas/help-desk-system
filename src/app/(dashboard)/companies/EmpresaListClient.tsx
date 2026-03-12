'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Search, Edit } from 'lucide-react';

export default function ClientListClient({ initialClients }: { initialClients: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter clients based on search
  const filteredClients = initialClients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.document.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.id)));
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
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} empresa(s)?`)) return;

    try {
      setIsDeleting(true);
      const { bulkDeleteClients } = await import('@/app/actions/admin');
      const ids = Array.from(selectedIds);
      await bulkDeleteClients(ids);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir empresas');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por razão social, CNPJ ou e-mail..." 
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
                checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th>Razão Social / Nome</th>
            <th>CNPJ / Documento</th>
            <th>Contato</th>
            <th>Usuários</th>
            <th>Chamados</th>
            <th style={{ width: '60px', textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Nenhuma empresa encontrada.
              </td>
            </tr>
          ) : (
            filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(client.id)}
                    onChange={() => toggleSelect(client.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>
                  <Link href={`/companies/${client.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                    {client.name}
                  </Link>
                </td>
                <td>{client.document}</td>
                <td style={{ color: 'var(--text-muted)' }}>{client.email || 'N/A'}<br />{client.phone}</td>
                <td>{client._count.users}</td>
                <td>{client._count.tickets}</td>
                <td style={{ textAlign: 'center' }}>
                  <Link 
                    href={`/companies/${client.id}`} 
                    className="btn-outline-sm" 
                    style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
                    title="Editar Empresa"
                  >
                    <Edit size={16} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
