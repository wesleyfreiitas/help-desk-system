'use client';

import { useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { createCustomField, deleteCustomField, updateCustomField } from '@/app/actions/customFields';

export default function CustomFieldsClient({ initialFields }: { initialFields: any[] }) {
  const [fields, setFields] = useState(initialFields);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newField, setNewField] = useState({ name: '', type: 'TEXT', options: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        const field = await updateCustomField(editingId, newField);
        setFields(fields.map(f => f.id === editingId ? field : f));
      } else {
        const field = await createCustomField(newField);
        setFields([...fields, field]);
      }
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar campo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (field: any) => {
    setNewField({ name: field.name, type: field.type, options: field.options || '' });
    setEditingId(field.id);
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleClose = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setNewField({ name: '', type: 'TEXT', options: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso excluirá todos os valores salvos para este campo em todas as empresas.')) return;

    try {
      await deleteCustomField(id);
      setFields(fields.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Campos Personalizados</h2>
          <p style={{ color: 'var(--text-muted)' }}>Defina campos extras para o cadastro de empresas.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(true)} style={{ width: 'auto' }}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Novo Campo
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome do Campo</th>
              <th>Tipo</th>
              <th>Opções</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum campo personalizado definido.
                </td>
              </tr>
            ) : (
              fields.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>{f.name}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>
                      {f.type}
                    </span>
                  </td>
                  <td>{f.options || '--'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => handleEdit(f)} className="btn-outline-sm" title="Editar">
                        <Settings2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="btn-outline-sm" style={{ color: '#ef4444' }} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Editar Campo' : 'Novo Campo Personalizado'}</h3>
              <button className="modal-close" onClick={handleClose}>&times;</button>
            </div>
            <form onSubmit={handleAddField}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Nome do Campo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newField.name} 
                      onChange={e => setNewField({...newField, name: e.target.value})} 
                      placeholder="Ex: Segmento, Nível de Suporte..."
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de Campo</label>
                    <select 
                      className="form-control" 
                      value={newField.type} 
                      onChange={e => setNewField({...newField, type: e.target.value})}
                    >
                      <option value="TEXT">Texto Curto</option>
                      <option value="TEXTAREA">Texto Longo (Até 300 Caracteres)</option>
                      <option value="NUMBER">Inteiro / Número</option>
                      <option value="BOOLEAN">Booleano (Sim/Não)</option>
                      <option value="SELECT">Lista (Seleção única)</option>
                      <option value="MULTISELECT">Multiseleção</option>
                    </select>
                  </div>
                  {(newField.type === 'SELECT' || newField.type === 'MULTISELECT') && (
                    <div className="form-group">
                      <label className="form-label">Opções (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newField.options} 
                        onChange={e => setNewField({...newField, options: e.target.value})} 
                        placeholder="Opção 1, Opção 2, Opção 3"
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleClose} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Campo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
