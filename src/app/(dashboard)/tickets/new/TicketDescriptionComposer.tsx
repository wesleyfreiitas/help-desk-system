'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';

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
      {/* Área de digitação */}
      <div className="email-composer-body">
        <textarea
          name="description"
          rows={8}
          required
          placeholder="Descreva o problema em detalhes..."
          className="email-composer-textarea"
        />
      </div>

      {/* Lista de anexos pendentes */}
      {files.length > 0 && (
        <div className="composer-attachments-preview">
          {files.map((file, idx) => (
            <div key={idx} className="attachment-pill">
              <Paperclip size={12} />
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={() => removeFile(idx)} className="remove-file">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barra de formatação (Visual apenas) */}
      <div className="email-composer-toolbar">
        <span className="ec-tool-btn ec-tool-bold">B</span>
        <span className="ec-tool-btn ec-tool-italic">I</span>
        <span className="ec-tool-btn ec-tool-underline">U</span>
        <span className="ec-tool-divider" />
        <span className="ec-tool-btn">H₁</span>
        <span className="ec-tool-btn">H₂</span>
        <span className="ec-tool-divider" />
        <span className="ec-tool-btn">≡</span>
        <span className="ec-tool-btn">⋮≡</span>
        <span className="ec-tool-divider" />
        <span className="ec-tool-btn">🔗</span>
        <span className="ec-tool-btn">🖼</span>
        <span className="ec-tool-btn">⊞</span>
        <span className="ec-tool-divider" />
        <span className="ec-tool-btn">{"{ }"}</span>
        <span className="ec-tool-btn">S̶</span>
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
