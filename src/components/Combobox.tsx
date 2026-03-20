'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface ComboboxItem {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
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

const getAvatarColor = (name: string) => {
  const colors = [
    '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', 
    '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

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
    const parentField = containerRef.current?.closest('.nt-field');
    if (isOpen && parentField) {
      parentField.classList.add('is-open');
    } else if (parentField) {
      parentField.classList.remove('is-open');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (parentField) parentField.classList.remove('is-open'); // Cleanup
    };
  }, [isOpen]);

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
        setTimeout(() => inputRef.current?.focus(), 0);
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
    <div 
      className="combobox-container" 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        zIndex: isOpen ? 1000 : 1 
      }}
    >
      {/* Trigger */}
      <div 
        className={`combobox-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.7rem 1rem',
          fontSize: '0.92rem',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 4px rgba(2, 132, 199, 0.08)' : 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
          {selectedItem && (
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: getAvatarColor(selectedItem.label),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'white',
              flexShrink: 0
            }}>
              {getInitials(selectedItem.label)}
            </div>
          )}
          <span style={{ 
            color: selectedItem ? 'var(--text-main)' : 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: selectedItem ? '500' : '400'
          }}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {allowClear && selectedValue && (
            <div 
              onClick={(e) => { e.stopPropagation(); handleSelect(null); }}
              style={{ padding: '4px', borderRadius: '50%', display: 'flex' }}
              className="clear-btn-hover"
            >
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
          <ChevronDown size={16} style={{ 
            color: 'var(--text-muted)', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginLeft: '4px'
          }} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="combobox-dropdown" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '420px',
          animation: 'comboboxIn 0.2s ease-out forwards',
        }}>
          {/* Search Box */}
          <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar..."
                autoFocus
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
                  onClick={() => setSearchTerm('')}
                  style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                />
              )}
            </div>
          </div>

          {/* Items List */}
          <div 
            className="combobox-list custom-scrollbar" 
            ref={listRef}
            style={{ 
              overflowY: 'auto', 
              maxHeight: '300px',
              padding: '6px'
            }}
          >
            {filteredItems.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedValue === item.id;
                const isFocused = focusedIndex === index;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: isFocused ? 'var(--primary-light)' : 'transparent',
                      color: isFocused ? 'var(--primary-hover)' : 'var(--text-main)',
                      transition: 'all 0.1s ease',
                      marginBottom: '2px'
                    }}
                  >
                    {/* Avatar Circle */}
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: item.avatar ? `url(${item.avatar})` : getAvatarColor(item.label),
                      backgroundSize: 'cover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      {!item.avatar && getInitials(item.label)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        fontWeight: isSelected ? '600' : '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.label}
                      </span>
                      {item.subLabel && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: isFocused ? 'var(--primary-hover)' : 'var(--text-muted)', 
                          opacity: 0.8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Card */}
          {items.length > 0 && (
            <div style={{ 
              padding: '10px 16px', 
              background: 'rgba(0,0,0,0.02)', 
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Exibindo {filteredItems.length} resultados</span>
              {items.length > filteredItems.length && (
                <span>Total: {items.length}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedValue} required={required} />

      <style jsx>{`
        @keyframes comboboxIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        .clear-btn-hover:hover {
          background: rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
