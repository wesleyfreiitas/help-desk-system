'use client';

import React, { useState } from 'react';
import { updateTicketField } from '@/app/actions/ticket';
import Combobox from '@/components/Combobox';

interface Option {
  id: string;
  name: string;
}

interface Props {
  ticketId: string;
  field: string;
  currentValue: string | null;
  options: Option[];
  placeholder?: string;
  isStatus?: boolean;
}

export default function TicketPropertySelect({ ticketId, field, currentValue, options, placeholder = 'Não informado', isStatus = false }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [localValue, setLocalValue] = useState(currentValue);

  const handleSelect = async (optionId: string) => {
    // Optimistic UI update
    const previousValue = localValue;
    setLocalValue(optionId || null);
    setIsPending(true);

    try {
      await updateTicketField(ticketId, field, optionId || null);
    } catch (error) {
      console.error('Failed to update ticket field:', error);
      // Revert on failure
      setLocalValue(previousValue);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="ticket-property-container" style={{ width: '100%', display: 'block', opacity: isPending ? 0.6 : 1 }}>
      <Combobox 
        name={field}
        defaultValue={localValue || ''}
        placeholder={placeholder}
        allowClear={!isStatus}
        onChange={handleSelect}
        items={options.map(o => ({ id: o.id, label: o.name }))}
      />
    </div>
  );
}
