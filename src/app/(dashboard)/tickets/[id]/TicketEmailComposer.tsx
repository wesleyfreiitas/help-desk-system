'use client';

import React, { useState, useRef } from 'react';
import { Reply, Paperclip, X } from 'lucide-react';
import { addInteraction } from '@/app/actions/ticket';

interface Props {
  ticketId: string;
  userRole: string;
}

export default function TicketEmailComposer({ ticketId, userRole }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
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
    <div className="email-composer-wrapper">
      <form 
        ref={formRef}
        action={async (formData) => {
          // Os arquivos não vão automaticamente via Server Action se não estiverem no input
          // Mas como vamos adicionar o input dentro do form, eles irão.
          const res = await addInteraction(ticketId, formData);
          if (res?.error) {
            alert(res.error);
          } else {
            formRef.current?.reset();
            setFiles([]);
          }
        }}
        encType="multipart/form-data"
      >

        {/* Área de digitação */}
        <div className="email-composer-body">
          <textarea
            name="message"
            rows={6}
            required
            placeholder="Digite sua resposta aqui..."
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

        {/* Barra de formatação (Simplificada) */}
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

        {/* Rodapé com ações e Enviar */}
        <div className="email-composer-footer">
          <div className="email-composer-footer-left">
            <button 
              type="button" 
              className="ec-attach-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              multiple 
              name="attachments"
              onChange={handleFileChange}
            />
            {userRole !== 'CLIENT' && (
              <label className="ec-internal-toggle">
                <input type="checkbox" name="isInternal" />
                Nota Interna
              </label>
            )}
          </div>
          <div className="email-composer-footer-right">
            <span className="ec-saved-label">Salvo</span>
            <button type="submit" className="ec-send-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Enviar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
