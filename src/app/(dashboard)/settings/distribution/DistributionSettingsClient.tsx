'use client';

import React, { useState } from 'react';
import { Save, User, ArrowRight, BarChart3, Settings2 } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl">
      <div className="card-custom p-6">
        <label className="flex items-center gap-3 cursor-pointer mb-6">
          <input 
            type="checkbox" 
            checked={config.enabled} 
            onChange={e => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 accent-primary"
          />
          <span className="font-semibold text-lg">Ativar Distribuição Automática</span>
        </label>

        {config.enabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Escolha do Modo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setConfig({ ...config, mode: 'SEQUENTIAL' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${config.mode === 'SEQUENTIAL' ? 'border-primary bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg ${config.mode === 'SEQUENTIAL' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <ArrowRight size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">Sequencial (Round-Robin)</h4>
                    <p className="text-xs text-slate-500 mt-1">Distribui um para cada atendente na ordem da lista.</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setConfig({ ...config, mode: 'LEAST_ASSIGNED' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${config.mode === 'LEAST_ASSIGNED' ? 'border-primary bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg ${config.mode === 'LEAST_ASSIGNED' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">Menor Carga</h4>
                    <p className="text-xs text-slate-500 mt-1">Distribui para o atendente que estiver com menos chamados abertos.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Atendentes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  Atendentes Elegíveis
                </h4>
                <div className="text-xs text-slate-500">{config.attendantIds.length} selecionado(s)</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {staff.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => toggleAttendant(member.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.attendantIds.includes(member.id) ? 'bg-slate-50 border-primary/30 ring-1 ring-primary/10' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${config.attendantIds.includes(member.id) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{member.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{member.role}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked={config.attendantIds.includes(member.id)}
                      className="accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t flex items-center justify-between">
          <div className="flex-1">
            {message && (
              <div className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Configuração</>}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
        <div className="bg-blue-600 text-white p-2 rounded-lg h-fit">
          <Settings2 size={20} />
        </div>
        <div>
          <h5 className="font-bold text-blue-900 text-sm">Como funciona?</h5>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
            A distribuição automática só afetará chamados criados com o status <strong>"ABERTO"</strong> 
            e que <strong>não tenham um atendente selecionado manualmente</strong>. 
            Se você ou o cliente atribuírem alguém no momento da criação, a redistribuição automática será ignorada.
          </p>
        </div>
      </div>
    </div>
  );
}
