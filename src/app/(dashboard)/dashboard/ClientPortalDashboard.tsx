'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Inbox, CheckCircle2, Search } from 'lucide-react';

interface ClientPortalDashboardProps {
  stats: any;
  recentTickets: any[];
}

export default function ClientPortalDashboard({ stats, recentTickets }: ClientPortalDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Bem-vindo e Ação Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Olá! Como podemos ajudar hoje?</h2>
          <p className="text-slate-500 mt-2">Acompanhe seus chamados ou abra uma nova solicitação.</p>
        </div>
        <Link href="/tickets/new" className="btn-primary py-4 px-8 text-lg flex items-center gap-3 shadow-lg shadow-blue-200 hover:scale-105 transition-transform">
          <Plus size={24} />
          Abrir Novo Chamado
        </Link>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-custom p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Inbox size={32} />
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.metrics.openCount}</div>
            <div className="text-slate-500 font-medium">Chamados em Aberto</div>
          </div>
        </div>

        <div className="card-custom p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.metrics.closedCount}</div>
            <div className="text-slate-500 font-medium">Chamados Finalizados</div>
          </div>
        </div>
      </div>

      {/* Meus Chamados Recentes */}
      <div className="card-custom overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Suas Solicitações Recentes</h3>
          <Link href="/tickets" className="text-primary font-semibold text-sm hover:underline">Ver Todos</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Protocolo</th>
                <th className="px-6 py-4 font-semibold">Assunto</th>
                <th className="px-6 py-4 font-semibold">Produto</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">
                    <Link href={`/tickets/${ticket.id}`}>#{ticket.protocol}</Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{ticket.title}</td>
                  <td className="px-6 py-4 text-slate-500">{ticket.product?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`badge status-${ticket.status.toLowerCase().replace('_', '')}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Você ainda não abriu nenhum chamado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
