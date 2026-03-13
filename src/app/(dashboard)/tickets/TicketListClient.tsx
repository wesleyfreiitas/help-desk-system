'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle, RefreshCcw, Merge, ChevronDown, Check, MessageSquare } from 'lucide-react';
import { updateTicketField, bulkUpdateStatus, bulkAssign, bulkDelete, bulkMerge } from '../../actions/ticket';

interface Props {
  tickets: any[];
  userId: string;
  users: any[];
  options: any[];
}

export default function TicketListClient({ tickets, userId, users, options }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // 'TICKET_ID-field' or 'bulk-assign'
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Bulk update form state
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkIsInternal, setBulkIsInternal] = useState(true);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const resetBulkForm = () => {
    setBulkStatus('');
    setBulkPriority('');
    setBulkMessage('');
    setBulkIsInternal(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBulkAction = (action: () => Promise<any>, successMsg: string, onComplete?: (result: any) => void) => {
    setOpenDropdownId(null);
    startTransition(async () => {
      try {
        const result = await action();
        setSelectedIds(new Set());
        if (onComplete) onComplete(result);
      } catch (err: any) {
        alert(err.message || 'Erro ao realizar ação em massa');
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(tickets.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleUpdateField = (ticketId: string, field: string, value: string | null) => {
    setOpenDropdownId(null);
    startTransition(async () => {
      try {
        await updateTicketField(ticketId, field, value);
      } catch (err) {
        console.error('Failed to update ticket field:', err);
        alert('Erro ao atualizar o chamado.');
      }
    });
  };

  const hasSelection = selectedIds.size > 0;
  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;
  const indeterminate = hasSelection && !allSelected;

  const selectedIdsArray = Array.from(selectedIds);

  return (
    <>
      <div ref={containerRef}>
        {hasSelection && (
          <div className="bulk-action-bar">
            <div className="bulk-action-left">
              <input
                type="checkbox"
                className="ticket-checkbox master-checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = indeterminate;
                }}
                onChange={handleSelectAll}
              />

              <div className="bulk-action-dropdown-container">
                <button
                  className="bulk-action-btn"
                  onClick={() => setOpenDropdownId(openDropdownId === 'bulk-assign' ? null : 'bulk-assign')}
                >
                  <UserPlus size={16} />
                  Atribuir
                </button>
                {openDropdownId === 'bulk-assign' && (
                  <div className="bulk-action-dropdown-menu" style={{ width: '200px' }}>
                    <button
                      className="dropdown-item"
                      onClick={() => handleBulkAction(() => bulkAssign(selectedIdsArray, null), 'Chamados desatribuídos')}
                    >
                      -- / Não atribuído
                    </button>
                    {users.map(u => (
                      <button
                        key={u.id}
                        className="dropdown-item"
                        onClick={() => handleBulkAction(() => bulkAssign(selectedIdsArray, u.id), 'Chamados atribuídos')}
                      >
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="bulk-action-btn"
                onClick={() => handleBulkAction(() => bulkUpdateStatus(selectedIdsArray, 'FECHADO'), 'Chamados fechados')}
              >
                <CheckCircle size={16} />
                Fechar
              </button>
              <button
                className="bulk-action-btn"
                onClick={() => {
                  resetBulkForm();
                  setShowBulkUpdateModal(true);
                }}
              >
                <RefreshCcw size={16} />
                Atualização em massa
              </button>
              <button
                className="bulk-action-btn"
                disabled={isPending}
                onClick={() => {
                  if (selectedIdsArray.length < 2) {
                    alert('Selecione ao menos 2 chamados para mesclar');
                    return;
                  }
                  if (confirm('Deseja mesclar os chamados selecionados? O mais antigo permanecerá aberto.')) {
                    handleBulkAction(
                      () => bulkMerge(selectedIdsArray),
                      'Chamados mesclados',
                      (newId) => {
                        window.location.href = `/tickets/${newId}`;
                      }
                    );
                  }
                }}
              >
                <Merge size={16} />
                Mesclar
              </button>

              <button className="bulk-action-btn">
                Cenários
              </button>

              <button
                className="bulk-action-btn text-danger"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => {
                  if (confirm('Deseja excluir os chamados selecionados?')) {
                    handleBulkAction(() => bulkDelete(selectedIdsArray), 'Chamados excluídos');
                  }
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        )}

        {showBulkUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
              <div className="modal-header">
                <h3>Atualização em massa ({selectedIds.size} chamados)</h3>
                <button className="modal-close" onClick={() => setShowBulkUpdateModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Alterar Status</label>
                    <select
                      className="form-control"
                      value={bulkStatus}
                      onChange={e => setBulkStatus(e.target.value)}
                    >
                      <option value="">Manter atual</option>
                      {options.filter(o => o.type === 'STATUS').map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alterar Prioridade</label>
                    <select
                      className="form-control"
                      value={bulkPriority}
                      onChange={e => setBulkPriority(e.target.value)}
                    >
                      <option value="">Manter atual</option>
                      {options.filter(o => o.type === 'PRIORITY').map(o => (
                         <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adicionar Resposta / Nota Interna</label>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="bulkIsInternal"
                        checked={!bulkIsInternal}
                        onChange={() => setBulkIsInternal(false)}
                      />
                      Resposta Pública
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="bulkIsInternal"
                        checked={bulkIsInternal}
                        onChange={() => setBulkIsInternal(true)}
                      />
                      Nota Interna
                    </label>
                  </div>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Digite a mensagem que será adicionada a todos os chamados selecionados..."
                    value={bulkMessage}
                    onChange={e => setBulkMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowBulkUpdateModal(false)}>Cancelar</button>
                <button
                  className="btn-primary"
                  disabled={isPending || (!bulkStatus && !bulkPriority && !bulkMessage)}
                  onClick={() => {
                    const { bulkUpdateTickets } = require('../../actions/ticket');
                    handleBulkAction(
                      () => bulkUpdateTickets(
                        selectedIdsArray,
                        bulkStatus || undefined,
                        bulkPriority || undefined,
                        bulkMessage || undefined,
                        bulkIsInternal
                      ),
                      'Chamados atualizados com sucesso',
                      () => setShowBulkUpdateModal(false)
                    );
                  }}
                >
                  {isPending ? 'Atualizando...' : 'Aplicar Atualizações'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ticket-list">
          {!hasSelection && tickets.length > 0 && (
            <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                className="ticket-checkbox"
                onChange={handleSelectAll}
                checked={false}
              />
            </div>
          )}

          {tickets.map((ticket: any) => {
            // Status calculation for avatar dot
            const statusOption = options.find(o => o.type === 'STATUS' && o.value === ticket.status);
            const statusColor = statusOption?.color || '#94a3b8';
            const statusLabel = statusOption?.label || ticket.status;

            const createdDate = new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const clientName = ticket.client ? ticket.client.name : 'Empresa Desconhecida';
            const requesterName = ticket.requester?.name || (ticket.client && ticket.client.users && ticket.client.users.length > 0 ? ticket.client.users[0].name : clientName);
            const assigneeName = ticket.assignee ? ticket.assignee.name : '-- / Não atribuído';
            const isSelected = selectedIds.has(ticket.id); // Changed to selectedIds.has
            const hasOpenDropdown = openDropdownId?.startsWith(ticket.id);

            const isOverdue = ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && new Date(ticket.createdAt).getTime() < Date.now() - (24 * 60 * 60 * 1000);

            return (
              <div key={ticket.id} className={`ticket-list-item ${isSelected ? 'selected' : ''} ${hasOpenDropdown ? 'has-open-dropdown' : ''}`}>
                <div className="ticket-left-side">
                  <input
                    type="checkbox"
                    className="ticket-checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectTicket(ticket.id)}
                  />

                  <div className="ticket-avatar-container">
                    <div className="ticket-avatar">
                      {requesterName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ticket-avatar-status">
                      <div className="avatar-status-dot" style={{ backgroundColor: statusColor }}></div>
                    </div>
                  </div>

                  <div className="ticket-center">
                    {ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
                      <div className={`ticket-sla-tag ${isOverdue ? 'overdue' : ''}`}>
                        {isOverdue ? 'Atrasado' : 'Primeira resposta'}
                      </div>
                    )}

                    <div
                      className="ticket-title-row"
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(() => setHoveredTicketId(ticket.id), 500);
                      }}
                      onMouseLeave={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredTicketId(null);
                      }}
                    >
                      <Link href={`/tickets/${ticket.id}`} className="ticket-title">
                        {ticket.title}
                      </Link>
                      <span className="ticket-id">#{ticket.id.slice(0, 6).toUpperCase()}</span>
                    </div>

                    {hoveredTicketId === ticket.id && (
                      <div className="ticket-hover-popover"
                        onMouseEnter={() => {
                          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                          setHoveredTicketId(ticket.id);
                        }}
                        onMouseLeave={() => {
                          setHoveredTicketId(null);
                        }}
                      >
                        <div className="popover-header">
                          <div className="avatar popover-avatar">
                            {ticket.client.name.charAt(0)}
                          </div>
                          <div className="popover-author-info">
                            <span className="popover-author-name">{ticket.client.name}</span> criou em
                            <span className="popover-date">{new Date(ticket.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="popover-body">
                          {ticket.description}
                        </div>
                        <div className="popover-footer">
                          <button className="popover-action">
                            <MessageSquare size={14} /> Responder
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="ticket-meta-row">
                      <span style={{ fontWeight: 500 }}>{requesterName} ({clientName})</span>
                      <span className="ticket-meta-dot"></span>
                      <span>Criado em {createdDate}</span>
                    </div>
                  </div>
                </div>

                <div className="ticket-right-side">
                  <div className="ticket-property-container">
                    <button
                      className="ticket-property-trigger"
                      onClick={() => setOpenDropdownId(openDropdownId === `${ticket.id}-priority` ? null : `${ticket.id}-priority`)}
                    >
                      <div className="ticket-priority-display">
                        <div className="priority-dot" style={{ backgroundColor: options.find(o => o.type === 'PRIORITY' && o.value === ticket.priority)?.color }}></div>
                        {options.find(o => o.type === 'PRIORITY' && o.value === ticket.priority)?.label || ticket.priority}
                      </div>
                      <ChevronDown size={14} className="property-chevron" />
                    </button>
                    {openDropdownId === `${ticket.id}-priority` && (
                      <div className="property-dropdown-menu">
                        {options.filter(o => o.type === 'PRIORITY').map(p => (
                          <button
                            key={p.value}
                            className={`property-dropdown-item ${ticket.priority === p.value ? 'selected' : ''}`}
                            onClick={() => handleUpdateField(ticket.id, 'priority', p.value)}
                            disabled={isPending}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div className="priority-dot" style={{ backgroundColor: p.color }}></div>
                              {p.label}
                            </div>
                            {ticket.priority === p.value && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ticket-property-container">
                    <button
                      className="ticket-property-trigger"
                      onClick={() => setOpenDropdownId(openDropdownId === `${ticket.id}-assignee` ? null : `${ticket.id}-assignee`)}
                    >
                      <div className="ticket-agent">
                        <UserPlus size={14} style={{ color: 'currentColor' }} />
                        {assigneeName}
                      </div>
                      <ChevronDown size={14} className="property-chevron" />
                    </button>
                    {openDropdownId === `${ticket.id}-assignee` && (
                      <div className="property-dropdown-menu">
                        <button
                          className={`property-dropdown-item ${!ticket.assignee ? 'selected' : ''}`}
                          onClick={() => handleUpdateField(ticket.id, 'assigneeId', null)}
                          disabled={isPending}
                        >
                          -- / Não atribuído
                          {!ticket.assignee && <Check size={14} />}
                        </button>
                        <button
                          className="property-dropdown-item"
                          disabled={isPending}
                          onClick={() => handleUpdateField(ticket.id, 'assigneeId', userId)}
                        >
                          Atribuir a mim
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="ticket-property-container">
                    <button
                      className="ticket-property-trigger"
                      onClick={() => setOpenDropdownId(openDropdownId === `${ticket.id}-status` ? null : `${ticket.id}-status`)}
                    >
                      <div className="ticket-status-mini">
                        <span className="badge" style={{ backgroundColor: statusColor, color: '#fff', transform: 'scale(0.85)', transformOrigin: 'right center', margin: 0 }}>
                          {statusLabel}
                        </span>
                      </div>
                      <ChevronDown size={14} className="property-chevron" />
                    </button>
                    {openDropdownId === `${ticket.id}-status` && (
                      <div className="property-dropdown-menu align-right">
                        {options.filter(o => o.type === 'STATUS').map(s => (
                          <button
                            key={s.value}
                            className={`property-dropdown-item ${ticket.status === s.value ? 'selected' : ''}`}
                            onClick={() => handleUpdateField(ticket.id, 'status', s.value)}
                            disabled={isPending}
                          >
                            <span className="badge" style={{ backgroundColor: s.color, color: '#fff', transform: 'scale(0.85)', transformOrigin: 'left center', margin: 0 }}>
                              {s.label}
                            </span>
                            {ticket.status === s.value && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Nenhum chamado encontrado.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
