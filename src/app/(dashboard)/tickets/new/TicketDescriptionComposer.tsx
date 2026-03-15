'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

export default function TicketDescriptionComposer() {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="email-composer-wrapper" style={{ marginTop: 0 }}>
      {/* Editor de Texto Rico */}
      <div className="email-composer-body" style={{ border: 'none', padding: 0 }}>
        <RichTextEditor 
          name="description" 
          placeholder="Descreva o problema em detalhes..." 
          required 
          minHeight="300px"
        />
      </div>

      {/* Rodapé interno apenas para o clip */}
      <div className="email-composer-footer" style={{ borderBottom: 'none' }}>
        <div className="email-composer-footer-left">
          <button 
            type="button" 
            className="ec-attach-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Anexar arquivos
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            multiple 
            name="attachments"
            onChange={handleFileChange}
          />
        </div>
        <div className="email-composer-footer-right">
           <span className="ec-saved-label" style={{ fontSize: '0.7rem' }}>Opcional</span>
        </div>
      </div>
    </div>
  );
}
