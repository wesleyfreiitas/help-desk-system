'use client';

import { useActionState, useEffect, useRef } from 'react';
import { changeTicketStatus } from '@/app/actions/ticket';

export default function TicketStatusForm({ ticketId, initialStatus }: { ticketId: string, initialStatus: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  
  // Wrap the server action so it can receive the ticketId prefilled
  const changeStatusAction = async (prevState: any, formData: FormData) => {
    await changeTicketStatus(ticketId, formData);
    return { error: null } as any;
  };

  const [state, formAction, isPending] = useActionState(changeStatusAction, { error: null });

  return (
    <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
       <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Alterar Status</label>
       <select 
         name="status" 
         defaultValue={initialStatus} 
         onChange={() => formRef.current?.requestSubmit()}
         disabled={isPending}
         style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
       >
         <option value="ABERTO">Aberto</option>
         <option value="EM_ANDAMENTO">Em Andamento</option>
         <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
         <option value="AGUARDANDO_TERCEIRO">Aguardando Terceiro</option>
         <option value="RESOLVIDO">Resolvido</option>
         <option value="FECHADO">Fechado</option>
         <option value="CANCELADO">Cancelado</option>
       </select>
       {state?.error && <div style={{color: 'red', fontSize: '0.8rem'}}>{state.error as string}</div>}
    </form>
  );
}
