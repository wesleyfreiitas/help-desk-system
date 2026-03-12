'use client';

import { useState } from 'react';
import { Save, Clock, AlertTriangle } from 'lucide-react';
import { updateSlaPolicies } from '@/app/actions/sla';

interface SlaPolicy {
  id?: string;
  priority: string;
  responseTime: number;
  resolutionTime: number;
}

interface SlaConfigFormProps {
  initialPolicies: SlaPolicy[];
}

const PRIORITIES = [
  { value: 'URGENTE', label: 'Urgente', color: '#ef4444' },
  { value: 'ALTA', label: 'Alta', color: '#f97316' },
  { value: 'MEDIA', label: 'Média', color: '#eab308' },
  { value: 'BAIXA', label: 'Baixa', color: '#22c55e' },
];

export default function SlaConfigForm({ initialPolicies }: SlaConfigFormProps) {
  const [policies, setPolicies] = useState<SlaPolicy[]>(() => {
    // Ensure we have all priorities represented
    return PRIORITIES.map(p => {
      const existing = initialPolicies.find(ip => ip.priority === p.value);
      return existing || { priority: p.value, responseTime: 60, resolutionTime: 480 };
    });
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (priority: string, field: 'responseTime' | 'resolutionTime', value: string) => {
    const numValue = parseInt(value) || 0;
    setPolicies(prev => prev.map(p => 
      p.priority === priority ? { ...p, [field]: numValue } : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSlaPolicies(policies.map(({ priority, responseTime, resolutionTime }) => ({
        priority,
        responseTime,
        resolutionTime
      })));
      setMessage({ type: 'success', text: 'Configurações de SLA salvas com sucesso!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao salvar as configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sla-config-form">
      <div className="sla-info-alert">
        <AlertTriangle size={18} />
        <p>Os tempos são definidos em <strong>minutos</strong>. Estas metas serão aplicadas automaticamente a novos chamados baseados na prioridade selecionada.</p>
      </div>

      <div className="sla-grid">
        <div className="sla-grid-header">
          <div className="sla-col-priority">Prioridade</div>
          <div className="sla-col-time">Primeira Resposta</div>
          <div className="sla-col-time">Resolução Total</div>
        </div>

        {policies.map((policy) => {
          const priorityInfo = PRIORITIES.find(p => p.value === policy.priority)!;
          return (
            <div key={policy.priority} className="sla-grid-row">
              <div className="sla-col-priority">
                <span className="priority-indicator" style={{ backgroundColor: priorityInfo.color }}></span>
                <span className="priority-label">{priorityInfo.label}</span>
              </div>
              <div className="sla-col-time">
                <div className="time-input-wrapper">
                  <input 
                    type="number" 
                    min="1"
                    value={policy.responseTime}
                    onChange={(e) => handleChange(policy.priority, 'responseTime', e.target.value)}
                    className="form-input"
                  />
                  <span className="time-unit">min ({Math.round(policy.responseTime / 60 * 10) / 10}h)</span>
                </div>
              </div>
              <div className="sla-col-time">
                <div className="time-input-wrapper">
                  <input 
                    type="number" 
                    min="1"
                    value={policy.resolutionTime}
                    onChange={(e) => handleChange(policy.priority, 'resolutionTime', e.target.value)}
                    className="form-input"
                  />
                  <span className="time-unit">min ({Math.round(policy.resolutionTime / 60 * 10) / 10}h)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="form-actions" style={{ marginTop: '2rem' }}>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isSaving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar Configurações</>}
        </button>
        {message && (
          <span className={`message-toast ${message.type}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
