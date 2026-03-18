import { prisma } from '@/lib/prisma';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Mail, AlertCircle, CheckCircle2, Filter, Calendar, RefreshCw } from 'lucide-react';
import { runEmailProcessor } from '@/app/actions/settings';

export default async function EmailLogsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string; status?: string; start?: string; end?: string }> 
}) {
  const params = await searchParams;
  
  const typeFilter = params.type || 'Todos';
  const statusFilter = params.status || 'Todos';
  const endDate = params.end ? endOfDay(parseISO(params.end)) : endOfDay(new Date());
  const startDate = params.start ? startOfDay(parseISO(params.start)) : startOfDay(subDays(endDate, 30));

  let logs = await prisma.emailLog.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(typeFilter !== 'Todos' ? { type: typeFilter.toUpperCase() } : {}),
      ...(statusFilter !== 'Todos' ? { status: statusFilter.toUpperCase() } : {}),
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Log de E-mails
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Monitore todos os e-mails recebidos e enviados pelo sistema.
          </p>
        </div>

        <form action={async () => {
          'use server';
          await runEmailProcessor();
        }}>
          <button type="submit" style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <RefreshCw size={18} /> Sincronizar Agora
          </button>
        </form>
      </div>

      {/* Filtros */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        padding: '2rem', 
        borderRadius: '24px', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem'
      }}>
        <form style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tipo de Email:</label>
            <select name="type" defaultValue={typeFilter} style={{ 
              padding: '10px 14px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-elevated)', 
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none'
            }}>
              <option value="Todos">Todos</option>
              <option value="Criação">Criação</option>
              <option value="Resposta">Resposta</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</label>
            <select name="status" defaultValue={statusFilter} style={{ 
              padding: '10px 14px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-elevated)', 
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none'
            }}>
              <option value="Todos">Todos</option>
              <option value="Processado">Processado</option>
              <option value="Rejeitado">Rejeitado</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Período:</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" name="start" defaultValue={format(startDate, 'yyyy-MM-dd')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input type="date" name="end" defaultValue={format(endDate, 'yyyy-MM-dd')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
            </div>
          </div>

          <button type="submit" style={{ 
            backgroundColor: 'var(--success)', 
            color: 'white', 
            border: 'none', 
            padding: '12px', 
            borderRadius: '12px', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}>
            <Search size={18} /> Pesquisar
          </button>
        </form>
      </div>

      {/* Tabela de Logs */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '24px', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'var(--premium-shadow)', 
        overflow: 'hidden' 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Período</th>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email de Origem</th>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email de Destino</th>
              <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      backgroundColor: log.status === 'REJEITADO' ? '#fee2e2' : '#dcfce7',
                      color: log.status === 'REJEITADO' ? '#b91c1c' : '#15803d',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      width: 'fit-content'
                    }}>
                      {log.status}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {log.type}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {format(log.createdAt, 'dd/MM/yyyy HH:mm:ss')}
                </td>
                <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.from}
                  </div>
                </td>
                <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.to}
                  </div>
                </td>
                <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.9rem' }}>{log.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.details}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Mail size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <p>Nenhum log de email encontrado no período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
