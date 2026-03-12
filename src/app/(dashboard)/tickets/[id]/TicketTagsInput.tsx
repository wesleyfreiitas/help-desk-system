'use client';

import React, { useState, useRef, useTransition, KeyboardEvent } from 'react';
import { updateTicketField } from '../../../actions/ticket';
import { Tag as TagIcon, X } from 'lucide-react';

interface Props {
  ticketId: string;
  initialTags: string;
}

export default function TicketTagsInput({ ticketId, initialTags }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>(
    initialTags ? initialTags.split(',').map(t => t.trim()).filter(Boolean) : []
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const saveTags = (newTags: string[]) => {
    const tagsString = newTags.join(',');
    startTransition(async () => {
      try {
        await updateTicketField(ticketId, 'tags', tagsString);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar tags');
        // Rollback on error
        setTags(initialTags ? initialTags.split(',').map(t => t.trim()).filter(Boolean) : []);
      }
    });
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      saveTags(newTags);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    saveTags(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="nt-field-container">
      <div 
        className={`ticket-property-trigger ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
        style={{ 
          cursor: 'text', 
          opacity: isPending ? 0.7 : 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '4px 8px',
          minHeight: '38px',
          alignItems: 'center'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="tag-remove"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (inputValue) addTag(inputValue);
          }}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          placeholder={tags.length === 0 ? "Adicionar tags..." : ""}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            flex: 1,
            minWidth: '60px',
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            margin: '2px 0'
          }}
        />
      </div>
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}

