'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { updateTicketField } from '@/app/actions/ticket';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [localValue, setLocalValue] = useState(currentValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (optionId: string | null) => {
    setIsOpen(false);
    
    // Optimistic UI update
    const previousValue = localValue;
    setLocalValue(optionId);
    setIsPending(true);

    try {
      await updateTicketField(ticketId, field, optionId);
    } catch (error) {
      console.error('Failed to update ticket field:', error);
      // Revert on failure
      setLocalValue(previousValue);
    } finally {
      setIsPending(false);
    }
  };

  const selectedOption = options.find(o => o.id === localValue);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  // Status mapping for visual badges (optional, depending on if we treat status differently visually)
  const renderDisplay = () => {
    if (isStatus && localValue) {
      const formattedStatusDisplay = localValue.replace('_', ' ');
      return (
        <span className={`badge status-${localValue.toLowerCase().replace('_', '')}`} style={{ transform: 'scale(0.9)', transformOrigin: 'left center', margin: 0 }}>
          {formattedStatusDisplay}
        </span>
      );
    }
    return <span style={{ fontWeight: 500 }}>{displayLabel}</span>;
  };

  return (
    <div className="ticket-property-container" ref={containerRef} style={{ width: '100%', display: 'block' }}>
      <button 
        className="ticket-property-trigger" 
        style={{ 
          width: '100%', 
          justifyContent: 'space-between', 
          padding: '0.4rem 0.6rem',
          margin: 0,
          border: '1px solid var(--border-color)', /* Mimicking the mockup's light border around choices */
          borderRadius: 'var(--radius-md)',
          opacity: isPending ? 0.6 : 1,
          backgroundColor: 'var(--surface)'
        }}
        onClick={() => !isPending && setIsOpen(!isOpen)}
        disabled={isPending}
      >
        {renderDisplay()}
        <ChevronDown size={14} className="property-chevron" style={{ opacity: 1, color: 'var(--text-main)' }} />
      </button>

      {isOpen && (
        <div className="property-dropdown-menu" style={{ width: '100%', left: 0, right: 'auto', maxHeight: '250px', overflowY: 'auto' }}>
          
          {/* Allow clearing selection for non-status optional fields */}
          {!isStatus && (
            <button 
              className={`property-dropdown-item ${!localValue ? 'selected' : ''}`}
              onClick={() => handleSelect(null)}
            >
              {placeholder}
              {!localValue && <Check size={14} />}
            </button>
          )}

          {options.map(option => (
            <button 
              key={option.id} 
              className={`property-dropdown-item ${localValue === option.id ? 'selected' : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              <span className="truncate">{option.name}</span>
              {localValue === option.id && <Check size={14} style={{flexShrink: 0}} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
