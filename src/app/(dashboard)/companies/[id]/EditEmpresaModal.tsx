'use client';

import { useState } from 'react';
import { X, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCustomFields } from '@/app/actions/customFields';
import { updateCustomFieldValues, updateClient } from '@/app/actions/admin';
import MultiSelectDropdown from '@/app/components/MultiSelectDropdown';

export default function EditClientModal({ client }: { client: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: client.name,
    document: client.document,
    email: client.email || '',
    phone: client.phone || '',
    website: client.website || '',
    active: client.active ?? true
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    client.customFields?.forEach((cf: any) => {
      initial[cf.fieldId] = cf.value;
    });
    return initial;
  });
  const [allFields, setAllFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const loadFields = async () => {
    try {
      const f = await getCustomFields();
      setAllFields(f.filter((field: any) => field.target !== 'USER'));
    } catch (e) {}
  };

  const handleOpen = () => {
    loadFields();
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.document.trim()) return;

    try {
      setIsSaving(true);
      
      await updateClient(client.id, {
        name: formData.name.trim(),
        document: formData.document.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        active: formData.active
      });
      
      // Update custom fields if any
      if (Object.keys(customFieldValues).length > 0) {
        await updateCustomFieldValues(client.id, customFieldValues);
      }

      setIsOpen(false);
      router.refresh();
      // Optional: alert('Empresa atualizada com sucesso!'); 
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao salvar: ' + (error.message || 'Verifique sua conexão ou permissões.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: string, isMulti: boolean = false, e?: any) => {
    if (isMulti && e) {
      const values = Array.from(e.target.selectedOptions).map((o: any) => o.value).join(',');
      setCustomFieldValues(prev => ({ ...prev, [fieldId]: values }));
    } else {
      setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
    }
  };

  return (
    <>
      <button onClick={handleOpen} className="action-bar-btn"><Edit size={14} /> Editar Empresa</button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Editar Empresa</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Nome Fantasia / Razão Social *</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Documento (CNPJ/CPF) *</label>
                    <input 
                      type="text" 
                      value={formData.document}
                      onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                      required
                      className="form-control"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">E-mail de Contato</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input 
                      type="text" 
                      value={formData.website}
                      placeholder="https://..."
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      id="edit-active" 
                      checked={formData.active} 
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }} 
                    />
                    <label htmlFor="edit-active" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>Empresa Ativa</label>
                  </div>

                  {allFields.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos Personalizados</h4>
                      <div className="custom-fields-grid-v2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        {allFields.map(field => (
                          <div key={field.id} className="form-group" style={{ gridColumn: field.type === 'TEXTAREA' ? '1 / span 2' : 'auto' }}>
                            <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{field.name}</label>
                            {field.type === 'BOOLEAN' ? (
                              <select 
                                value={customFieldValues[field.id] || 'false'} 
                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                className="form-control nt-select"
                              >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                              </select>
                            ) : field.type === 'SELECT' || field.type === 'MULTISELECT' ? (
                              field.type === 'MULTISELECT' ? (
                                <MultiSelectDropdown
                                  options={field.options?.split(',').map((o: string) => o.trim()) || []}
                                  selectedValues={customFieldValues[field.id]?.split(',').filter(Boolean) || []}
                                  onChange={(values) => handleCustomFieldChange(field.id, values.join(','))}
                                />
                              ) : (
                                <select 
                                  value={customFieldValues[field.id] || ''} 
                                  onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                  className="form-control nt-select"
                                >
                                  <option value="">Selecione...</option>
                                  {field.options?.split(',').map((opt: string) => (
                                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                  ))}
                                </select>
                              )
                            ) : field.type === 'TEXTAREA' ? (
                              <textarea 
                                value={customFieldValues[field.id] || ''}
                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                className="form-control"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                maxLength={300}
                              />
                            ) : (
                              <input 
                                type={field.type === 'NUMBER' ? 'number' : 'text'}
                                value={customFieldValues[field.id] || ''}
                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                className="form-control"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
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
