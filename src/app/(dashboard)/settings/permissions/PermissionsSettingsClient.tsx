'use client';

import { useState } from 'react';
import { RolePermissions, updatePermissions } from '@/app/actions/permissions';
import { Save, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function PermissionsSettingsClient({ initialPermissions }: { initialPermissions: RolePermissions }) {
  const { success, error } = useToast();
  const [permissions, setPermissions] = useState<RolePermissions>(initialPermissions);
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { id: 'ATTENDANT', label: 'Staff (Atendente)' },
    { id: 'ORG_MANAGER', label: 'Gerente (Cliente)' },
    { id: 'ORG_MEMBER', label: 'Membro (Cliente)' },
    { id: 'CLIENT', label: 'Cliente (Legado)' },
  ];

  const resources = [
    { id: 'users', label: 'Usuários' },
    { id: 'tickets', label: 'Chamados' },
    { id: 'companies', label: 'Empresas' },
    { id: 'products', label: 'Produtos' },
    { id: 'categories', label: 'Categorias' },
    { id: 'settings', label: 'Configurações' },
  ];

  const actions = [
    { id: 'view', label: 'Ver' },
    { id: 'create', label: 'Criar' },
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Excluir' },
  ];

  const handleToggle = (role: string, resource: string, action: string) => {
    setPermissions(prev => {
      const next = { ...prev };
      if (!next[role]) next[role] = {};
      if (!next[role][resource]) {
        next[role][resource] = { view: false, create: false, edit: false, delete: false };
      }
      
      next[role][resource] = {
        ...next[role][resource],
        [action]: !next[role][resource][action]
      };
      
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePermissions(permissions);
      success('Permissões salvas com sucesso!');
    } catch (err) {
      error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="permissions-settings">
      <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="text-primary" /> Matriz de Permissões
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Controle o que cada cargo pode acessar e realizar no sistema.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '200px' }}>Recurso / Cargo</th>
              {roles.map(role => (
                <th key={role.id} style={{ textAlign: 'center' }}>{role.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => (
              <tr key={resource.id}>
                <td style={{ fontWeight: 600 }}>{resource.label}</td>
                {roles.map(role => (
                  <td key={role.id} style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {actions.map(action => {
                        const isChecked = permissions[role.id]?.[resource.id]?.[action.id] || false;
                        return (
                          <label 
                            key={action.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.4rem', 
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: isChecked ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                              border: isChecked ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleToggle(role.id, resource.id, action.id)}
                            />
                            <span style={{ color: isChecked ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                              {action.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', display: 'flex', gap: '0.75rem' }}>
        <Info size={20} color="#b45309" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
          <strong>Nota:</strong> O cargo de <strong>Administrador</strong> possui acesso total e irrestrito a todas as áreas, não sendo listado nesta matriz. 
          As alterações aqui refletem instantaneamente para os usuários logados após o próximo carregamento de página.
        </p>
      </div>
    </div>
  );
}
