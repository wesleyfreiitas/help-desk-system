'use client';

import { useState } from 'react';
import { X, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

import MultiSelectDropdown from '@/app/components/MultiSelectDropdown';

export default function EditUserModal({ user, clients, currentRole, availableCustomFields = [] }: { user: any, clients: any[], currentRole: string, availableCustomFields?: any[] }) {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    extension: user.extension || '',
    clientId: user.clientId || ''
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    user.customFields?.forEach((cf: any) => {
      initial[cf.fieldId] = cf.value;
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) return;

    try {
      setIsSaving(true);
      const { updateUser } = await import('@/app/actions/admin');
      
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone.trim() || null,
        extension: formData.extension.trim() || null
      };

      const isClientRelated = ['ORG_MEMBER', 'ORG_MANAGER'].includes(formData.role);
      if (isClientRelated) {
          payload.clientId = formData.clientId;
      } else {
          payload.clientId = null;
      }

      await updateUser(user.id, payload);
      
      // Update custom fields if any
      const { updateUserCustomFieldValues } = await import('@/app/actions/admin');
      if (Object.keys(customFieldValues).length > 0 || availableCustomFields.length > 0) {
        await updateUserCustomFieldValues(user.id, customFieldValues);
      }

      setIsOpen(false);
      success('Usuário atualizado com sucesso!');
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const isClientRelated = ['ORG_MEMBER', 'ORG_MANAGER'].includes(formData.role);

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="action-bar-btn"><Edit size={14} /> Editar</button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Editar Usuário</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail *</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  {['ADMIN', 'ATTENDANT'].includes(formData.role) && (
                    <div className="form-group">
                      <label className="form-label">Ramal (Upphone)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Ex: 5001"
                        value={formData.extension}
                        onChange={(e) => setFormData(prev => ({ ...prev, extension: e.target.value }))}
                      />
                    </div>
                  )}

                  {currentRole === 'ADMIN' && (
                    <div className="form-group">
                      <label className="form-label">Perfil / Função *</label>
                      <select 
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value, clientId: !['ORG_MEMBER', 'ORG_MANAGER'].includes(e.target.value) ? '' : prev.clientId }))}
                        required
                      >
                        <option value="ORG_MEMBER">Membro (Cliente)</option>
                        <option value="ORG_MANAGER">Gerente (Cliente)</option>
                        <option value="ATTENDANT">Staff (Atendente)</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                  )}

                  {isClientRelated && (
                    <div className="form-group">
                      <label className="form-label">Empresa Vinculada *</label>
                      <select 
                        className="form-control"
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        required={isClientRelated}
                      >
                        <option value="">Selecione a empresa...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {availableCustomFields.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos Personalizados</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        {availableCustomFields.map(field => (
                          <div key={field.id} className="form-group" style={{ gridColumn: field.type === 'TEXTAREA' ? '1 / span 2' : 'auto' }}>
                            <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{field.name}</label>
                            {field.type === 'BOOLEAN' ? (
                              <select 
                                value={customFieldValues[field.id] || 'false'} 
                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                className="form-control"
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
                                  className="form-control"
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
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
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
