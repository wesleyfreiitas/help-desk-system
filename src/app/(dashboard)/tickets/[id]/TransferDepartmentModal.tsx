'use client';

import { useState, useTransition } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { transferTicketToDepartment } from '@/app/actions/departments';
import { useRouter } from 'next/navigation';

export default function TransferDepartmentModal({ ticketId, currentDepartmentId, departments }: {
  ticketId: string;
  currentDepartmentId: string | null;
  departments: { id: string; name: string; color?: string | null }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(currentDepartmentId || '');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleTransfer = () => {
    startTransition(async () => {
      await transferTicketToDepartment(ticketId, selectedDept || null);
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="action-bar-btn"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowRightLeft size={14} /> Transferir Departamento
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Transferir Departamento</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Selecione o departamento de destino. O atendente atual será desatribuído.
              </p>
              <select
                className="form-control nt-select"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="">— Sem departamento —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id} disabled={d.id === currentDepartmentId}>
                    {d.name}{d.id === currentDepartmentId ? ' (atual)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsOpen(false)}>Cancelar</button>
              <button
                className="btn-primary"
                disabled={isPending || selectedDept === currentDepartmentId}
                onClick={handleTransfer}
              >
                {isPending ? 'Transferindo...' : 'Confirmar Transferência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
