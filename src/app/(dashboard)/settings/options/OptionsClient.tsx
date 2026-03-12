'use client';

import React, { useState } from 'react';
import { upsertTicketOption, deleteTicketOption } from '@/app/actions/settings';
import { Trash2, Plus, GripVertical } from 'lucide-react';

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
  const [options, setOptions] = useState(initialOptions);
  const [activeTab, setActiveTab] = useState('TYPE');

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
      setOptions(prev => prev.filter(o => o.id !== id));
    }
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
        <div className="options-header">
          <h3>Gerenciar {types.find(t => t.id === activeTab)?.label}</h3>
        </div>

        <form 
          className="options-add-form"
          action={async (formData) => {
            await upsertTicketOption(formData);
            // Simples reload para atualizar a lista ou usar query local
            window.location.reload();
          }}
        >
          <input type="hidden" name="type" value={activeTab} />
          <div className="opt-form-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Nome Exibido</label>
              <input name="label" placeholder="Ex: Urgente" required className="form-control" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Código (Valor)</label>
              <input name="value" placeholder="Ex: URGENTE" required className="form-control" />
            </div>
            {(activeTab === 'STATUS' || activeTab === 'PRIORITY') && (
              <div style={{ width: '60px' }}>
                <label className="form-label">Cor</label>
                <input name="color" type="color" defaultValue="#3b82f6" className="form-control" style={{ padding: '0.2rem', height: '42px' }} title="Cor" />
              </div>
            )}
            <div style={{ width: '80px' }}>
              <label className="form-label">Ordem</label>
              <input name="order" type="number" defaultValue={filteredOptions.length + 1} className="form-control" title="Ordem" />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '42px' }}>
              <Plus size={16} /> Adicionar
            </button>
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
                      <button onClick={() => handleDelete(opt.id)} className="btn-icon-delete">
                        <Trash2 size={16} />
                      </button>
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
