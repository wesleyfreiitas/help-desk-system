'use client';

import { useState } from 'react';
import Combobox from '@/components/Combobox';

export default function ClientSelector({ clients }: { clients: any[] }) {
  const [role, setRole] = useState('ORG_MEMBER');

  return (
    <>
      <div className="form-group" style={{ marginBottom: 0 }}>
         <label htmlFor="role">Perfil de Acesso</label>
         <Combobox 
           name="role" 
           defaultValue={role}
           onChange={(val) => setRole(val || 'ORG_MEMBER')}
           required 
           items={[
             { id: 'ORG_MEMBER', label: 'Membro (Cliente)' },
             { id: 'ORG_MANAGER', label: 'Gerente (Cliente)' },
             { id: 'ATTENDANT', label: 'Staff (Atendente)' },
             { id: 'ADMIN', label: 'Administrador' }
           ]}
         />
      </div>

      {['ADMIN', 'ATTENDANT'].includes(role) && (
        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="extension">Ramal (Upphone)</label>
           <input 
             type="text" 
             id="extension" 
             name="extension" 
             placeholder="Ex: 5001" 
             style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-elevated)', color: 'var(--text-main)' }}
           />
        </div>
      )}

      {['ORG_MEMBER', 'ORG_MANAGER'].includes(role) && (
        <div className="form-group" style={{ marginBottom: 0 }}>
           <label>Empresa (Apenas para Membros/Gerentes)</label>
           <Combobox 
             name="clientId"
             placeholder="Pesquisar empresa por nome ou documento..."
             required
             items={clients.map((client: any) => ({
               id: client.id,
               label: client.name,
               subLabel: client.document
             }))}
           />
        </div>
      )}
    </>
  );
}
