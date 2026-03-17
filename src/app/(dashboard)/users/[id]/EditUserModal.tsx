'use client';

import { useState } from 'react';
import { X, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditUserModal({ user, clients, currentRole }: { user: any, clients: any[], currentRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    clientId: user.clientId || ''
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
        phone: formData.phone.trim() || null
      };

      const isClientRelated = ['ORG_MEMBER', 'ORG_MANAGER', 'CLIENT'].includes(formData.role);
      if (isClientRelated) {
          payload.clientId = formData.clientId;
      } else {
          payload.clientId = null;
      }

      await updateUser(user.id, payload);
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const isClientRelated = ['ORG_MEMBER', 'ORG_MANAGER', 'CLIENT'].includes(formData.role);

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

                  {currentRole === 'ADMIN' && (
                    <div className="form-group">
                      <label className="form-label">Perfil / Função *</label>
                      <select 
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value, clientId: !['ORG_MEMBER', 'ORG_MANAGER', 'CLIENT'].includes(e.target.value) ? '' : prev.clientId }))}
                        required
                      >
                        <option value="ORG_MEMBER">Membro (Cliente)</option>
                        <option value="ORG_MANAGER">Gerente (Cliente)</option>
                        <option value="ATTENDANT">Staff (Atendente)</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="CLIENT">Cliente (Legado)</option>
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
