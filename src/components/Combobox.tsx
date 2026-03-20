'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface ComboboxItem {
  id: string;
  label: string;
  subLabel?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
  allowClear?: boolean;
}

export default function Combobox({ 
  items, 
  name, 
  placeholder = "Pesquisar...", 
  required = false,
  defaultValue = "",
  onChange,
  allowClear = false
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Update internal state if defaultValue changes externally
  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => 
    items.find(item => item.id === selectedValue), 
  [items, selectedValue]);

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  };

  const filteredItems = useMemo(() => {
    const term = removeAccents(searchTerm.trim().toLowerCase());
    if (!term) return items;
    
    return items.filter(item => {
      const label = removeAccents(item.label.toLowerCase());
      const subLabel = item.subLabel ? removeAccents(item.subLabel.toLowerCase()) : '';
      
      return label.includes(term) || subLabel.includes(term);
    });
  }, [items, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: ComboboxItem | null) => {
    const newVal = item ? item.id : '';
    setSelectedValue(newVal);
    setSearchTerm('');
    setIsOpen(false);
    setFocusedIndex(-1);
    if (onChange) onChange(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
          handleSelect(filteredItems[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="combobox-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`combobox-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.85rem',
          fontSize: '0.92rem',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
        }}
      >
        <span style={{ 
          color: selectedItem ? 'var(--text-main)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1
        }}>
          {selectedItem ? (
            <>
              {selectedItem.label}
              {selectedItem.subLabel && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({selectedItem.subLabel})
                </span>
              )}
            </>
          ) : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {allowClear && selectedValue && (
            <div 
              onClick={(e) => { e.stopPropagation(); handleSelect(null); }}
              style={{ padding: '4px', borderRadius: '50%', display: 'flex' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
          <ChevronDown size={14} style={{ 
            color: 'var(--text-muted)', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            marginLeft: '4px'
          }} />
        </div>
      </div>

      {isOpen && (
        <div className="combobox-dropdown" style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px',
        }}>
          <div className="combobox-search-wrapper" style={{
            padding: '8px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pesquisar..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
              }}
            />
            {searchTerm && (
              <X 
                size={14} 
                className="clear-search" 
                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); inputRef.current?.focus(); }}
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
              />
            )}
          </div>

          <div 
            className="combobox-list" 
            ref={listRef}
            style={{ 
              overflowY: 'auto', 
              maxHeight: '300px',
              padding: '4px'
            }}
          >
            {filteredItems.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: focusedIndex === index ? 'var(--primary-light)' : 'transparent',
                    color: focusedIndex === index ? 'var(--primary-hover)' : 'var(--text-main)',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: selectedValue === item.id ? '600' : '400' }}>{item.label}</span>
                    {item.subLabel && <span style={{ fontSize: '0.75rem', color: focusedIndex === index ? 'var(--primary-hover)' : 'var(--text-muted)', opacity: 0.8 }}>{item.subLabel}</span>}
                  </div>
                  {selectedValue === item.id && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedValue} required={required} />
    </div>
  );
}
