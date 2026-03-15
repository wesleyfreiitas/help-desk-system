'use client';

import React, { useState } from 'react';
import { Save, User, ArrowRight, BarChart3, Settings2, Check } from 'lucide-react';
import { updateSystemSetting } from '@/app/actions/settings';

export default function DistributionSettingsClient({ initialConfig, staff }: { initialConfig: any, staff: any[] }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await updateSystemSetting('ticket_distribution', config);
      setMessage({ type: 'success', text: 'Configurações de distribuição salvas com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendant = (id: string) => {
    const newIds = config.attendantIds.includes(id)
      ? config.attendantIds.filter((cid: string) => cid !== id)
      : [...config.attendantIds, id];
    setConfig({ ...config, attendantIds: newIds });
  };

  return (
    <div className="distribution-container">
      <div className="card-custom main-card">
        {/* Toggle Ativar */}
        <div className="activation-section">
          <div className="switch-container">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={config.enabled} 
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
            <span className="label-text">Ativar Distribuição Automática</span>
          </div>
        </div>

        {config.enabled && (
          <div className="settings-content animate-in">
            {/* Escolha do Modo */}
            <div className="section-title">Algoritmo de Atribuição</div>
            <div className="modes-grid">
              <div 
                onClick={() => setConfig({ ...config, mode: 'SEQUENTIAL' })}
                className={`mode-card ${config.mode === 'SEQUENTIAL' ? 'active' : ''}`}
              >
                <div className="mode-icon">
                  <ArrowRight size={24} />
                </div>
                <div className="mode-info">
                  <h4 className="mode-name">Sequencial (Round-Robin)</h4>
                  <p className="mode-desc">Distribui um para cada atendente seguindo a ordem da lista.</p>
                </div>
                {config.mode === 'SEQUENTIAL' && <div className="check-badge"><Check size={14} /></div>}
              </div>

              <div 
                onClick={() => setConfig({ ...config, mode: 'LEAST_ASSIGNED' })}
                className={`mode-card ${config.mode === 'LEAST_ASSIGNED' ? 'active' : ''}`}
              >
                <div className="mode-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="mode-info">
                  <h4 className="mode-name">Menor Carga</h4>
                  <p className="mode-desc">Atribui para o atendente com menos chamados abertos no momento.</p>
                </div>
                {config.mode === 'LEAST_ASSIGNED' && <div className="check-badge"><Check size={14} /></div>}
              </div>
            </div>

            {/* Seleção de Atendentes */}
            <div className="attendants-section">
              <div className="section-header">
                <div className="section-title">
                  <User size={18} />
                  Atendentes Participantes
                </div>
                <div className="count-badge">{config.attendantIds.length} selecionado(s)</div>
              </div>
              
              <div className="staff-grid">
                {staff.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => toggleAttendant(member.id)}
                    className={`staff-item ${config.attendantIds.includes(member.id) ? 'selected' : ''}`}
                  >
                    <div className="staff-avatar">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="staff-info">
                      <div className="staff-name">{member.name}</div>
                      <div className="staff-role">{member.role}</div>
                    </div>
                    <div className="staff-checkbox">
                      <div className={`custom-check ${config.attendantIds.includes(member.id) ? 'checked' : ''}`}>
                         {config.attendantIds.includes(member.id) && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer com Botão */}
        <div className="card-footer">
          <div className="message-area">
            {message && (
              <div className={`status-message ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-primary save-btn"
          >
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Configuração</>}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <div className="info-icon">
          <Settings2 size={24} />
        </div>
        <div className="info-text">
          <h5>Como a distribuição funciona?</h5>
          <p>
            A atribuição ocorre apenas em chamados criados com o status <strong>"ABERTO"</strong> 
            e que <strong>não tiveram</strong> um atendente selecionado manualmente no formulário. 
            Se um atendente for escolhido manualmente, a regra de distribuição é ignorada.
          </p>
        </div>
      </div>

      <style jsx>{`
        .distribution-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .main-card {
           padding: 2rem !important;
           margin-bottom: 1.5rem;
        }

        .activation-section {
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 2rem;
        }

        .switch-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          user-select: none;
        }

        .label-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .section-title {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .mode-card {
          position: relative;
          display: flex;
          gap: 1.25rem;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-color);
          cursor: pointer;
          transition: var(--transition);
          background: var(--surface);
        }

        .mode-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .mode-card.active {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }

        .mode-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color);
          color: var(--text-muted);
          transition: var(--transition);
          flex-shrink: 0;
        }

        .mode-card.active .mode-icon {
          background-color: var(--primary);
          color: white;
        }

        .mode-info {
          flex: 1;
        }

        .mode-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .mode-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .check-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
        }

        .attendants-section {
          margin-top: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 99px;
          color: var(--text-muted);
        }

        .staff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 0.75rem;
        }

        .staff-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--surface);
          cursor: pointer;
          transition: var(--transition);
        }

        .staff-item:hover {
          background-color: var(--bg-color);
        }

        .staff-item.selected {
          border-color: var(--primary-hover);
          background-color: var(--primary-light);
          box-shadow: 0 0 0 1px var(--primary-hover);
        }

        .staff-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .selected .staff-avatar {
          background-color: var(--primary);
          color: white;
        }

        .staff-info {
          flex: 1;
          min-width: 0;
        }

        .staff-name {
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .staff-role {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          color: var(--text-muted);
        }

        .custom-check {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          background: var(--bg-elevated);
        }

        .custom-check.checked {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .card-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .message-area {
          flex: 1;
        }

        .status-message {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-message.success { color: var(--success); }
        .status-message.error { color: var(--danger); }

        .save-btn {
          min-width: 180px;
          height: 48px;
        }

        .info-box {
          background-color: rgba(2, 132, 199, 0.1);
          border: 1px solid rgba(2, 132, 199, 0.2);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          color: var(--primary);
          flex-shrink: 0;
        }

        .info-text h5 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .info-text p {
          font-size: 0.85rem;
          color: var(--text-main);
          opacity: 0.8;
          line-height: 1.5;
        }

        .animate-in {
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
