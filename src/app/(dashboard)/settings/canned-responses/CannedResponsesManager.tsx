'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, MessageSquare } from 'lucide-react';
import { createCannedResponse, updateCannedResponse, deleteCannedResponse } from '@/app/actions/canned-responses';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

interface CannedResponsesManagerProps {
  initialResponses: CannedResponse[];
}

export default function CannedResponsesManager({ initialResponses }: CannedResponsesManagerProps) {
  const [responses, setResponses] = useState<CannedResponse[]>(initialResponses);
  const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or id
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (response: CannedResponse) => {
    setIsEditing(response.id);
    setFormData({ title: response.title, content: response.content });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({ title: '', content: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing === 'new') {
        const newResponse = await createCannedResponse(formData);
        setResponses([newResponse, ...responses]);
      } else if (isEditing) {
        const updated = await updateCannedResponse(isEditing, formData);
        setResponses(responses.map(r => r.id === isEditing ? updated : r));
      }
      handleCancel();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar resposta rápida.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta resposta rápida?')) return;
    try {
      await deleteCannedResponse(id);
      setResponses(responses.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir resposta rápida.');
    }
  };

  return (
    <div className="canned-responses-container">
      <div className="settings-section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="settings-section-title">Respostas Rápidas</h3>
          <p className="settings-section-description">Crie modelos de texto para agilizar o atendimento.</p>
        </div>
        {!isEditing && (
          <button className="btn-primary" onClick={() => setIsEditing('new')}>
            <Plus size={18} /> Nova Resposta
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="canned-response-form-container">
          <div className="nt-field" style={{ border: '1px solid var(--border-color)', borderBottom: 'none', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: 'var(--bg-card)' }}>
            <label className="nt-label" style={{ color: 'var(--primary)', opacity: 0.8 }}>Título da Resposta</label>
            <input 
              type="text" 
              className="nt-input" 
              placeholder="Ex: Saudação Inicial"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="email-composer-wrapper" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            {/* Título da seção de conteúdo similar ao label NT */}
            <div style={{ padding: '0.85rem 1.5rem 0', background: 'var(--bg-card)' }}>
               <label className="nt-label" style={{ color: 'var(--primary)', opacity: 0.8 }}>Conteúdo da Resposta</label>
            </div>
            
            <div className="email-composer-body">
              <textarea
                className="email-composer-textarea"
                placeholder="Digite o texto da resposta..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                required
                style={{ minHeight: '200px' }}
              />
            </div>

            <div className="email-composer-toolbar">
              <span className="ec-tool-btn ec-tool-bold">B</span>
              <span className="ec-tool-btn ec-tool-italic">I</span>
              <span className="ec-tool-btn ec-tool-underline">U</span>
              <span className="ec-tool-divider" />
              <span className="ec-tool-btn">H₁</span>
              <span className="ec-tool-btn">H₂</span>
              <span className="ec-tool-divider" />
              <span className="ec-tool-btn">≡</span>
              <span className="ec-tool-btn">⋮≡</span>
              <span className="ec-tool-divider" />
              <span className="ec-tool-btn">🔗</span>
              <span className="ec-tool-btn">🖼</span>
              <span className="ec-tool-btn">⊞</span>
              <span className="ec-tool-divider" />
              <span className="ec-tool-btn">{"{ }"}</span>
              <span className="ec-tool-btn">S̶</span>
            </div>

            <div className="email-composer-footer">
              <div className="email-composer-footer-left">
                {/* Botão Variáveis removido a pedido do usuário */}
              </div>
              <div className="email-composer-footer-right" style={{ gap: '1rem' }}>
                <button type="button" className="btn-outline-sm" onClick={handleCancel} style={{ border: 'none' }}>
                  <X size={16} /> Cancelar
                </button>
                <button type="submit" className="ec-send-btn" disabled={isSaving} style={{ padding: '0.5rem 1.5rem' }}>
                  <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Resposta'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="canned-responses-list">
        {responses.map(response => (
          <div key={response.id} className="canned-response-card">
            <div className="canned-response-header">
              <div className="canned-response-title-area">
                <MessageSquare size={18} className="icon-muted" />
                <h4>{response.title}</h4>
              </div>
              <div className="canned-response-actions">
                <button className="btn-icon" onClick={() => handleEdit(response)} title="Editar">
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(response.id)} title="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="canned-response-body">
              <p>{response.content}</p>
            </div>
          </div>
        ))}
        {responses.length === 0 && !isEditing && (
          <div className="empty-state">
            <MessageSquare size={48} />
            <p>Nenhuma resposta rápida cadastrada ainda.</p>
            <button className="btn-outline-sm" onClick={() => setIsEditing('new')}>Criar a primeira</button>
          </div>
        )}
      </div>
    </div>
  );
}
