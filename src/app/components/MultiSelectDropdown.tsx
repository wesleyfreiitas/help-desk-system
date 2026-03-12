'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecione...',
  label
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} itens selecionados`;
  };

  return (
    <div className="ms-dropdown-container" ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      <div 
        className={`ms-dropdown-toggle ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <span className={selectedValues.length === 0 ? 'ms-placeholder' : ''}>
          {getDisplayText()}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div className="ms-dropdown-menu">
          {options.map(option => {
            const isSelected = selectedValues.includes(option);
            return (
              <div 
                key={option} 
                className={`ms-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleOption(option)}
              >
                <div className="ms-dropdown-checkbox">
                  {isSelected && <Check size={12} color="white" />}
                </div>
                <span>{option}</span>
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="ms-dropdown-item" style={{ cursor: 'default', color: 'var(--text-muted)' }}>
              Nenhuma opção disponível
            </div>
          )}
        </div>
      )}
    </div>
  );
}
