'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Search, Edit } from 'lucide-react';

export default function UserListClient({ initialUsers, currentUserId, clients }: { initialUsers: any[], currentUserId: string, clients: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'CLIENT', clientId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users based on search
  const filteredUsers = initialUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
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
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} usuário(s)?`)) return;

    if (selectedIds.has(currentUserId)) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }

    try {
      setIsDeleting(true);
      const { bulkDeleteUsers } = await import('@/app/actions/admin');
      const ids = Array.from(selectedIds);
      await bulkDeleteUsers(ids);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir usuários');
    } finally {
      setIsDeleting(false);
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
            placeholder="Buscar por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%' }}
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
                checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil / Função</th>
            <th>Empresa Vinculada</th>
            <th>Data de Cadastro</th>
            <th style={{ width: '60px', textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Nenhum usuário encontrado.
              </td>
            </tr>
          ) : (
            filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>
                  <Link href={`/users/${u.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                    {u.name}
                  </Link>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge`} style={{ 
                    backgroundColor: u.role === 'ADMIN' ? '#fee2e2' : 
                                    u.role === 'ATTENDANT' ? '#e0f2fe' : 
                                    u.role === 'ORG_MANAGER' ? '#dcfce7' :
                                    u.role === 'ORG_MEMBER' ? '#f0fdf4' :
                                    '#f1f5f9', 
                    color: u.role === 'ADMIN' ? '#991b1b' : 
                           u.role === 'ATTENDANT' ? '#075985' : 
                           u.role === 'ORG_MANAGER' ? '#166534' :
                           u.role === 'ORG_MEMBER' ? '#15803d' :
                           '#475569' 
                  }}>
                    {u.role === 'ORG_MANAGER' ? 'Gerente' : u.role === 'ORG_MEMBER' ? 'Membro' : u.role}
                  </span>
                </td>
                <td>{u.client ? u.client.name : 'N/A (Staff)'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => {
                      setEditingUser(u);
                      setEditForm({
                        name: u.name,
                        email: u.email,
                        phone: u.phone || '',
                        role: u.role,
                        clientId: u.clientId || ''
                      });
                    }}
                    className="btn-outline-sm" 
                    style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
                    title="Editar Usuário"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Editar Usuário</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const { updateUser } = await import('@/app/actions/admin');
                await updateUser(editingUser.id, editForm);
                setEditingUser(null);
                window.location.reload();
              } catch (err: any) {
                alert(err.message || 'Erro ao atualizar');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input type="email" className="form-control" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input type="text" className="form-control" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Perfil / Função</label>
                    <select className="form-control" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                      <option value="ORG_MEMBER">Membro (Cliente)</option>
                      <option value="ORG_MANAGER">Gerente (Cliente)</option>
                      <option value="ATTENDANT">Staff (Atendente)</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="CLIENT">Cliente (Legado)</option>
                    </select>
                  </div>
                  {['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(editForm.role) && (
                    <div className="form-group">
                      <label className="form-label">Empresa Vinculada</label>
                      <select className="form-control" value={editForm.clientId} onChange={e => setEditForm({...editForm, clientId: e.target.value})} required>
                         <option value="">-- Selecione a empresa --</option>
                         {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
