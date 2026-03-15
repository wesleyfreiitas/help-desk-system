'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import Combobox from '@/components/Combobox';

export default function TicketFilterSidebar({ clients, users, options, categories }: { clients: any[], users: any[], options: any[], categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('query') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const assigneeId = searchParams.get('assigneeId') || '';
  const clientId = searchParams.get('clientId') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tickets?${params.toString()}`);
  };

  return (
    <div className="filter-sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          FILTROS
        </h3>
        {/* Usando Link ou reset via params vazios */}
        {(query || status || priority || assigneeId || clientId || categoryId) && (
          <button
            onClick={() => router.push('/tickets')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Limpar tudo
          </button>
        )}
      </div>

      <div className="filter-group">
        <label className="filter-label">CATEGORIA</label>
        <Combobox 
          name="categoryId"
          placeholder="Qualquer categoria"
          defaultValue={categoryId}
          allowClear
          onChange={(val) => handleFilterChange('categoryId', val)}
          items={categories.map(c => ({ id: c.id, label: c.name }))}
        />
      </div>

      <div className="filter-group">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Pesquisar campos"
            className="filter-input-text"
            defaultValue={query}
            onBlur={(e) => handleFilterChange('query', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('query', e.currentTarget.value)}
          />
        </div>
      </div>

      {users.length > 0 && (
        <div className="filter-group">
          <label className="filter-label">Agente Responsável</label>
          <Combobox 
            name="assigneeId"
            placeholder="Qualquer usuário"
            defaultValue={assigneeId}
            allowClear
            onChange={(val) => handleFilterChange('assigneeId', val)}
            items={users.map(u => ({ id: u.id, label: u.name }))}
          />
        </div>
      )}

      {clients.length > 0 && (
        <div className="filter-group">
          <label className="filter-label">Empresas</label>
          <Combobox 
            name="clientId"
            placeholder="Qualquer empresa"
            defaultValue={clientId}
            allowClear
            onChange={(val) => handleFilterChange('clientId', val)}
            items={clients.map(c => ({ id: c.id, label: c.name }))}
          />
        </div>
      )}

      <div className="filter-group">
        <label className="filter-label">Status</label>
        <Combobox 
          name="status"
          placeholder="Qualquer status"
          defaultValue={status}
          allowClear
          onChange={(val) => handleFilterChange('status', val)}
          items={options.filter(o => o.type === 'STATUS').map(o => ({ id: o.value, label: o.label }))}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Prioridade</label>
        <Combobox 
          name="priority"
          placeholder="Qualquer prioridade"
          defaultValue={priority}
          allowClear
          onChange={(val) => handleFilterChange('priority', val)}
          items={options.filter(o => o.type === 'PRIORITY').map(o => ({ id: o.value, label: o.label }))}
        />
      </div>
    </div>
  );
}
