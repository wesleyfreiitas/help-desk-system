'use client';

import { useState, useTransition } from 'react';
import { addDepartmentMember, removeDepartmentMember, updateDepartment, deleteDepartment } from '@/app/actions/departments';
import { useRouter } from 'next/navigation';
import { UserPlus, Trash2, Crown, Settings2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function DepartmentManager({ department, nonMembers }: { department: any; nonMembers: any[] }) {
  const { success, error } = useToast();
  const [selectedUser, setSelectedUser] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: department.name, description: department.description || '', color: department.color || '#6366f1', active: department.active });
  const router = useRouter();

  const handleAddMember = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      await addDepartmentMember(department.id, selectedUser, isLeader);
      setSelectedUser('');
      router.refresh();
    });
  };

  const handleRemove = (userId: string) => {
    if (!confirm('Remover este agente do departamento?')) return;
    startTransition(async () => {
      await removeDepartmentMember(department.id, userId);
      router.refresh();
    });
  };

  const handleSaveEdit = () => {
    startTransition(async () => {
      await updateDepartment(department.id, editData);
      setEditMode(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Excluir o departamento "${department.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      try {
        await deleteDepartment(department.id);
        success('Departamento excluído com sucesso!');
        router.push('/departments');
      } catch (e: any) {
        error(e.message);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Edit Card */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Configurações</span>
          <button onClick={() => setEditMode(!editMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
            <Settings2 size={14} /> {editMode ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="form-control" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Nome" />
            <textarea className="form-control" value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} placeholder="Descrição" style={{ minHeight: '70px', resize: 'vertical' }} />
            <input type="color" value={editData.color} onChange={e => setEditData(p => ({ ...p, color: e.target.value }))} style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '2px', cursor: 'pointer' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={editData.active} onChange={e => setEditData(p => ({ ...p, active: e.target.checked }))} style={{ accentColor: 'var(--primary)' }} />
              Departamento Ativo
            </label>
            <button onClick={handleSaveEdit} className="btn-primary" disabled={isPending} style={{ width: '100%' }}>Salvar</button>
          </div>
        ) : (
          <button onClick={handleDelete} disabled={isPending} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <Trash2 size={14} /> Excluir Departamento
          </button>
        )}
      </div>

      {/* Members Card */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Agentes ({department.members?.length || 0})
        </h3>

        {/* Current Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
          {(department.members || []).map((m: any) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                  {m.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.user.name}</div>
                  {m.isLeader && <div style={{ fontSize: '0.65rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}><Crown size={10} /> Líder</div>}
                </div>
              </div>
              <button onClick={() => handleRemove(m.userId)} disabled={isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Member */}
        {nonMembers.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select className="form-control nt-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ fontSize: '0.8rem' }}>
              <option value="">Adicionar agente...</option>
              {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={isLeader} onChange={e => setIsLeader(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
              Definir como Líder
            </label>
            <button onClick={handleAddMember} disabled={isPending || !selectedUser} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}>
              <UserPlus size={14} /> Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
