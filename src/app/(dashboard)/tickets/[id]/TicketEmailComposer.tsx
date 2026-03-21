'use client';

import React, { useState, useRef } from 'react';
import { Reply, Paperclip, X } from 'lucide-react';
import { addInteraction } from '@/app/actions/ticket';
import RichTextEditor from '@/components/RichTextEditor';
import { useToast } from '@/components/Toast';

interface Props {
  ticketId: string;
  userRole: string;
}

export default function TicketEmailComposer({ ticketId, userRole }: Props) {
  const { error } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [initialDraft, setInitialDraft] = useState('');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftKey = `ticket-draft-${ticketId}`;

  // Carregar rascunho do localStorage ao montar
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setInitialDraft(savedDraft);
      setIsDraftSaved(true);
    }
  }, [ticketId, draftKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleMessageChange = (content: string) => {
    if (content && content !== '<br>' && content !== '') {
      localStorage.setItem(draftKey, content);
      setIsDraftSaved(true);
    } else {
      localStorage.removeItem(draftKey);
      setIsDraftSaved(false);
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
          const res = await addInteraction(ticketId, formData);
          if (res?.error) {
            error(res.error);
          } else {
            // Limpar rascunho após o envio bem-sucedido
            localStorage.removeItem(draftKey);
            setIsDraftSaved(false);
            
            formRef.current?.reset();
            setFiles([]);
            setInitialDraft('');
            setResetKey(prev => prev + 1);
          }
        }}
        encType="multipart/form-data"
      >

        {/* Editor de Texto Rico */}
        <div className="email-composer-body" style={{ border: 'none', padding: 0 }}>
          <RichTextEditor 
            key={`${ticketId}-${resetKey}`}
            name="message" 
            placeholder="Digite sua resposta aqui..." 
            initialValue={initialDraft}
            onChange={handleMessageChange}
            required 
            minHeight="200px"
          />
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
            <span className={`ec-saved-label ${isDraftSaved ? 'visible' : ''}`}>
              {isDraftSaved && <span style={{fontSize: '10px'}}>✔️</span>}
              {isDraftSaved ? 'Rascunho salvo' : 'Aguardando...'}
            </span>
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
