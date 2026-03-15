'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { upsertTicketOption, deleteTicketOption } from '@/app/actions/settings';
import { Trash2, Plus, GripVertical, Pencil, X } from 'lucide-react';

interface Option {
  id: string;
  type: string;
  label: string;
  value: string;
  color?: string | null;
  order: number;
}

interface Props {
  initialOptions: Option[];
}

export default function OptionsClient({ initialOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [options, setOptions] = useState(initialOptions);
  
  // Get active tab from URL or default to TYPE
  const activeTab = searchParams.get('tab') || 'TYPE';

  const [editingOption, setEditingOption] = useState<Option | null>(null);

  // Sync internal state when props change (after router.refresh)
  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
    setEditingOption(null);
  };

  const types = [
    { id: 'TYPE', label: 'Tipos' },
    { id: 'SOURCE', label: 'Fontes' },
    { id: 'STATUS', label: 'Status' },
    { id: 'PRIORITY', label: 'Prioridades' },
  ];

  const filteredOptions = options.filter(opt => opt.type === activeTab);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta opção?')) {
      await deleteTicketOption(id);
      router.refresh();
      if (editingOption?.id === id) setEditingOption(null);
    }
  };

  const handleEdit = (opt: Option) => {
    setEditingOption(opt);
    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingOption(null);
  };

  return (
    <div className="options-manager">
      <div className="options-sidebar">
        {types.map(t => (
          <button
            key={t.id}
            className={`options-type-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="options-main">
        <div className="options-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Gerenciar {types.find(t => t.id === activeTab)?.label}</h3>
          {editingOption && (
            <span className="edit-badge" style={{ fontSize: '0.8rem', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Editando: {editingOption.label}
            </span>
          )}
        </div>

        <form 
          key={editingOption?.id || 'new'}
          className="options-add-form"
          action={async (formData) => {
            await upsertTicketOption(formData);
            setEditingOption(null);
            router.refresh();
          }}
        >
          <input type="hidden" name="type" value={activeTab} />
          {editingOption && <input type="hidden" name="id" value={editingOption.id} />}
          
          <div className="opt-form-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Nome Exibido</label>
              <input 
                name="label" 
                placeholder="Ex: Urgente" 
                required 
                className="form-control" 
                defaultValue={editingOption?.label || ''}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Código (Valor)</label>
              <input 
                name="value" 
                placeholder="Ex: URGENTE" 
                required 
                className="form-control" 
                defaultValue={editingOption?.value || ''}
              />
            </div>
            {(activeTab === 'STATUS' || activeTab === 'PRIORITY') && (
              <div style={{ width: '60px' }}>
                <label className="form-label">Cor</label>
                <input 
                  name="color" 
                  type="color" 
                  defaultValue={editingOption?.color || "#3b82f6"} 
                  className="form-control" 
                  style={{ padding: '0.2rem', height: '42px' }} 
                  title="Cor" 
                />
              </div>
            )}
            <div style={{ width: '80px' }}>
              <label className="form-label">Ordem</label>
              <input 
                name="order" 
                type="number" 
                defaultValue={editingOption ? editingOption.order : filteredOptions.length + 1} 
                className="form-control" 
                title="Ordem" 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ height: '42px' }}>
                {editingOption ? <><Pencil size={16} /> Salvar</> : <><Plus size={16} /> Adicionar</>}
              </button>
              {editingOption && (
                <button type="button" onClick={cancelEdit} className="btn-outline" style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <X size={16} /> Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="options-list">
          {filteredOptions.length === 0 ? (
            <p className="empty-msg">Nenhuma opção configurada.</p>
          ) : (
            <table className="options-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Nome</th>
                  <th>Valor/Código</th>
                  {(activeTab === 'STATUS' || activeTab === 'PRIORITY') && <th>Cor</th>}
                  <th>Ordem</th>
                  <th style={{ width: '80px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map(opt => (
                  <tr key={opt.id}>
                    <td><GripVertical size={14} className="drag-handle" /></td>
                    <td>{opt.label}</td>
                    <td><code>{opt.value}</code></td>
                    {(activeTab === 'STATUS' || activeTab === 'PRIORITY') && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: opt.color || '#ccc' }}></div>
                          {opt.color}
                        </div>
                      </td>
                    )}
                    <td>{opt.order}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(opt)} className="btn-icon-edit" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(opt.id)} className="btn-icon-delete" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
