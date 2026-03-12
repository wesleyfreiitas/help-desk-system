'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

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
        <select
          className="filter-select"
          value={categoryId}
          onChange={(e) => handleFilterChange('categoryId', e.target.value)}
        >
          <option value="">Qualquer categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
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
          <label className="filter-label">Usuários Incluídos</label>
          <select
            className="filter-select"
            value={assigneeId}
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
          >
            <option value="">Qualquer usuário</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {clients.length > 0 && (
        <div className="filter-group">
          <label className="filter-label">Empresas</label>
          <select
            className="filter-select"
            value={clientId}
            onChange={(e) => handleFilterChange('clientId', e.target.value)}
          >
            <option value="">Qualquer empresa</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label className="filter-label">Status</label>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Qualquer status</option>
          {options.filter(o => o.type === 'STATUS').map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Prioridade</label>
        <select
          className="filter-select"
          value={priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">Qualquer prioridade</option>
          {options.filter(o => o.type === 'PRIORITY').map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
