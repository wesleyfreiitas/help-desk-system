'use client';

import { useState } from 'react';

export default function ClientSelector({ clients }: { clients: any[] }) {
  const [role, setRole] = useState('ORG_MEMBER');

  return (
    <>
      <div className="form-group" style={{ marginBottom: 0 }}>
         <label htmlFor="role">Perfil de Acesso</label>
         <select 
           id="role" 
           name="role" 
           value={role}
           onChange={(e) => setRole(e.target.value)}
           required 
           style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
         >
           <option value="ORG_MEMBER">Membro (Cliente)</option>
           <option value="ORG_MANAGER">Gerente (Cliente)</option>
           <option value="ATTENDANT">Staff (Atendente)</option>
           <option value="ADMIN">Administrador</option>
         </select>
      </div>

      {['ORG_MEMBER', 'ORG_MANAGER', 'CLIENT'].includes(role) && (
        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="clientId">Empresa (Apenas para Membros/Gerentes)</label>
           <select 
             id="clientId" 
             name="clientId" 
             required 
             style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
           >
             <option value="">-- Selecione a Empresa --</option>
             {clients.map((client: any) => (
               <option key={client.id} value={client.id}>{client.name}</option>
             ))}
           </select>
        </div>
      )}
    </>
  );
}
