'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, 
  AlignLeft, List, Link as LinkIcon, Image as ImageIcon, 
  Type, Code, Strikethrough, ChevronDown
} from 'lucide-react';

interface RichTextEditorProps {
  name: string;
  placeholder?: string;
  initialValue?: string;
  minHeight?: string;
  required?: boolean;
}

export default function RichTextEditor({ 
  name, 
  placeholder = "Digite aqui...", 
  initialValue = "",
  minHeight = "200px",
  required = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialValue && !content) {
      editorRef.current.innerHTML = initialValue;
      setContent(initialValue);
    }
  }, [initialValue]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`rich-text-editor-container ${isFocused ? 'focused' : ''}`} style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.1)' : 'none',
      borderColor: isFocused ? 'var(--primary)' : 'var(--border-color)',
    }}>
      {/* Toolbar */}
      <div className="rich-text-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        <ToolbarButton onClick={() => execCommand('bold')} icon={<Bold size={16} />} title="Negrito (Ctrl+B)" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={<Italic size={16} />} title="Itálico (Ctrl+I)" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={<Underline size={16} />} title="Sublinhado (Ctrl+U)" />
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />
        
        <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} icon={<Heading1 size={16} />} title="Título 1" />
        <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} icon={<Heading2 size={16} />} title="Título 2" />
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} title="Alinhar à Esquerda" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} title="Lista" />
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => {
          const url = prompt('Digite a URL:');
          if (url) execCommand('createLink', url);
        }} icon={<LinkIcon size={16} />} title="Inserir Link" />
        
        <ToolbarButton onClick={() => execCommand('formatBlock', '<pre>')} icon={<Code size={16} />} title="Bloco de Código" />
        <ToolbarButton onClick={() => execCommand('strikethrough')} icon={<Strikethrough size={16} />} title="Tachado" />
      </div>

      {/* Editable Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          minHeight: minHeight,
          padding: '16px',
          outline: 'none',
          color: 'var(--text-main)',
          lineHeight: '1.6',
          fontSize: '0.95rem',
        }}
      />

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={content} required={required} />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          cursor: text;
        }
        .focused {
          border-color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-main)',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
    </button>
  );
}
