'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Inbox, CheckCircle2 } from 'lucide-react';

interface ClientPortalDashboardProps {
  stats: any;
  recentTickets: any[];
}

export default function ClientPortalDashboard({ stats, recentTickets }: ClientPortalDashboardProps) {
  return (
    <div className="client-portal-container">
      {/* Bem-vindo e Ação Principal */}
      <div className="welcome-card card-custom">
        <div className="welcome-text">
          <h2>Olá! Como podemos ajudar hoje?</h2>
          <p>Acompanhe seus chamados ou abra uma nova solicitação.</p>
        </div>
        <Link href="/tickets/new" className="btn-primary create-btn">
          <Plus size={24} />
          Abrir Novo Chamado
        </Link>
      </div>

      {/* Resumo Rápido */}
      <div className="stats-row">
        <div className="card-custom stat-box">
          <div className="stat-icon open">
            <Inbox size={32} />
          </div>
          <div className="stat-data">
            <div className="stat-number">{stats.metrics.openCount}</div>
            <div className="stat-label">Chamados em Aberto</div>
          </div>
        </div>

        <div className="card-custom stat-box">
          <div className="stat-icon closed">
            <CheckCircle2 size={32} />
          </div>
          <div className="stat-data">
            <div className="stat-number">{stats.metrics.closedCount}</div>
            <div className="stat-label">Chamados Finalizados</div>
          </div>
        </div>
      </div>

      {/* Meus Chamados Recentes */}
      <div className="card-custom table-card">
        <div className="table-header">
          <h3>Suas Solicitações Recentes</h3>
          <Link href="/tickets" className="view-all">Ver Todos</Link>
        </div>
        
        <div className="table-responsive">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Assunto</th>
                <th>Produto</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="protocol-cell">
                    <Link href={`/tickets/${ticket.id}`}>#{ticket.protocol}</Link>
                  </td>
                  <td className="title-cell">{ticket.title}</td>
                  <td className="product-cell">{ticket.product?.name || '—'}</td>
                  <td>
                    <span className={`badge status-${ticket.status.toLowerCase().replace('_', '')}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Você ainda não abriu nenhum chamado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .client-portal-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .welcome-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2.5rem !important;
          background-color: var(--surface);
          border-color: var(--border-color);
        }

        .welcome-text h2 {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        .welcome-text p {
          color: var(--text-muted);
          margin-top: 0.5rem;
          font-size: 1rem;
        }

        .create-btn {
          height: 56px;
          padding: 0 2rem;
          font-size: 1.1rem;
          gap: 0.75rem;
          box-shadow: var(--shadow-lg);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .stat-box {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem !important;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.open {
          background-color: rgba(2, 132, 199, 0.1);
          color: var(--primary);
        }

        .stat-icon.closed {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .table-card {
          padding: 0 !important;
          overflow: hidden;
        }

        .table-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .table-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .view-all {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .portal-table {
          width: 100%;
          border-collapse: collapse;
        }

        .portal-table th {
          background-color: var(--bg-color);
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .portal-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .portal-table tr:last-child td {
          border-bottom: none;
        }

        .portal-table tr:hover td {
          background-color: var(--primary-light);
        }

        .protocol-cell {
          font-weight: 700;
          color: var(--primary);
        }

        .title-cell {
          font-weight: 600;
        }

        .product-cell, .date-cell {
          color: var(--text-muted);
        }

        .empty-state {
          padding: 4rem !important;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .welcome-card {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
