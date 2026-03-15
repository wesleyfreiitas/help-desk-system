'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { endOfDay, format } from 'date-fns';

export function DashboardDateFilter({ defaultFrom, defaultTo }: { defaultFrom: Date; defaultTo: Date }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializa o estado com as datas (da URL ou do defaultValue do servidor)
  const [fromDate, setFromDate] = useState(
    searchParams.get('from') ? searchParams.get('from')!.split('T')[0] : format(defaultFrom, 'yyyy-MM-dd')
  );
  
  const [toDate, setToDate] = useState(
    searchParams.get('to') ? searchParams.get('to')!.split('T')[0] : format(defaultTo, 'yyyy-MM-dd')
  );

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (fromDate) {
      params.set('from', new Date(fromDate).toISOString());
    } else {
      params.delete('from');
    }

    if (toDate) {
      // Ajusta para o final do dia para garantir que pega os registros daquele dia inteiro
      const toDateEnd = endOfDay(new Date(toDate));
      params.set('to', toDateEnd.toISOString());
    } else {
      params.delete('to');
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.25rem 0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input 
        type="date" 
        value={fromDate} 
        onChange={e => setFromDate(e.target.value)}
        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', color: 'inherit', fontFamily: 'inherit' }}
      />
      <span style={{ color: 'var(--text-muted)' }}>-</span>
      <input 
        type="date" 
        value={toDate} 
        onChange={e => setToDate(e.target.value)}
        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', color: 'inherit', fontFamily: 'inherit' }}
      />
      <button 
        onClick={applyFilter}
        style={{ 
          background: 'var(--primary)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          padding: '2px 8px', 
          fontSize: '0.75rem', 
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Filtrar
      </button>
    </div>
  );
}
