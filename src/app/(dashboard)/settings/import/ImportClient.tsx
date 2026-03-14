'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Users, Building2, Ticket } from 'lucide-react';
import { bulkImportClients, bulkImportUsers, bulkImportTickets } from '@/app/actions/admin';

type ImportType = 'companies' | 'users' | 'tickets';

export default function ImportTool() {
  const [importType, setImportType] = useState<ImportType>('companies');
  const [data, setData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ created: number, updated?: number, errors: string[] } | null>(null);

  const parseExcelPaste = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++; // Skip the next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === '\t') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          if (char === '\r') i++; // Skip \n
        } else if (char !== '\r') {
          currentField += char;
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    // Filtrar linhas completamente vazias e tentar remover cabeçalhos
    const validRows = rows.filter(row => row.some(cell => cell.trim().length > 0));
    const firstCell = validRows[0]?.[0]?.toLowerCase() || '';
    if (firstCell.includes('nome') || firstCell.includes('assunto')) {
      validRows.shift(); // Remove a primeira linha se for detectada como cabeçalho
    }

    return validRows;
  };

  const handleImport = async () => {
    if (!data.trim()) return;

    try {
      setIsProcessing(true);
      setResult(null);

      const parsedRows = parseExcelPaste(data);
      
      if (importType === 'companies') {
        const clients = parsedRows.map(parts => {
          return {
            name: parts[0]?.trim(),
            email: parts[1]?.trim() || null,
            document: parts[2]?.trim(),
            extras: {
              'Firewall': parts[3]?.trim(),
              'IP - Upphone': parts[4]?.trim(),
              'Integrações': parts[5]?.trim(),
              'Notas de Implantação': parts[6]?.trim(),
            }
          };
        });
        const res = await bulkImportClients(clients);
        setResult(res);
      } else if (importType === 'users') {
        const users = parsedRows.map(parts => {
          return {
            name: parts[0]?.trim(),
            email: parts[1]?.trim(),
            phone: parts[2]?.trim() || null,
            companyDocument: parts[3]?.trim(),
            companyName: parts[6]?.trim(),
          };
        });
        const res = await bulkImportUsers(users);
        setResult(res);
      } else {
        const tickets = parsedRows.map(parts => {
          return {
            title: parts[0]?.trim(),
            description: parts[1]?.trim(),
            productName: parts[2]?.trim(),
            categoryName: parts[3]?.trim(),
            assigneeName: parts[4]?.trim(),
            requesterName: parts[5]?.trim(),
            companyName: parts[6]?.trim(),
            priority: parts[7]?.trim(),
            deadline: parts[8]?.trim(),
            createdAt: parts[9]?.trim(),
            problemResolved: parts[10]?.trim(),
            firstResponseDone: parts[11]?.trim(),
            resolvedAt: parts[12]?.trim(),
            firstResponseAt: parts[13]?.trim(),
            reopened: parts[14]?.trim(),
            requesterEmail: parts[15]?.trim(),
            companyDocument: parts[16]?.trim(),
          };
        });
        const res = await bulkImportTickets(tickets);
        setResult(res);
      }

      setData('');
    } catch (error: any) {
      alert(error.message || 'Erro ao importar dados');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => { setImportType('companies'); setResult(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', 
              border: '1px solid ' + (importType === 'companies' ? 'var(--primary-color)' : 'var(--border-color)'),
              background: importType === 'companies' ? 'var(--primary-light)' : 'transparent',
              color: importType === 'companies' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <Building2 size={18} />
            Empresas
          </button>
          <button 
            onClick={() => { setImportType('users'); setResult(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', 
              border: '1px solid ' + (importType === 'users' ? 'var(--primary-color)' : 'var(--border-color)'),
              background: importType === 'users' ? 'var(--primary-light)' : 'transparent',
              color: importType === 'users' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <Users size={18} />
            Clientes
          </button>
          <button 
            onClick={() => { setImportType('tickets'); setResult(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '8px', 
              border: '1px solid ' + (importType === 'tickets' ? 'var(--primary-color)' : 'var(--border-color)'),
              background: importType === 'tickets' ? 'var(--primary-light)' : 'transparent',
              color: importType === 'tickets' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <Ticket size={18} />
            Chamados
          </button>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
          {importType === 'companies' ? 'Importação de Empresas' : importType === 'users' ? 'Importação de Clientes' : 'Importação de Chamados'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
          Copie os dados do seu Excel e cole abaixo. <br />
          {importType === 'companies' ? (
            <><strong>Colunas:</strong> <code>Nome ; Email ; CNPJ ; Firewall ; IP ; Integrações ; Notas</code></>
          ) : importType === 'users' ? (
            <><strong>Colunas:</strong> <code>Nome ; Email ; Telefone ; CNPJ Org ; ... ; ... ; Nome Org</code></>
          ) : (
            <><strong>Colunas:</strong> <code>Assunto ; Msg ; Prod ; Cat ; Atendente ; Cliente ; Emp ; Prio ; Deadline ; Criação ; Fechado ; Prim Rep ; Finalização ; Data Resp ; Reaberto ; Email ; CNPJ</code></>
          )}
        </p>
      </div>

      <div className="card-body">
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            className="input-field"
            style={{ minHeight: '350px', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre' }}
            placeholder={`Cole aqui as linhas de ${importType === 'companies' ? 'empresas' : importType === 'users' ? 'clientes' : 'chamados'}...`}
            value={data}
            onChange={(e) => setData(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {result && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 600 }}>{result.created} criados</span>
              </div>
              {result.updated !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontWeight: 600 }}>{result.updated} atualizados</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontWeight: 600 }}>{result.errors.length} erros</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: '#ef4444' }}>
                {result.errors.map((err, i) => <div key={i}>• {err}</div>)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleImport} 
            disabled={isProcessing || !data.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                Processando...
              </>
            ) : (
              <>
                <Upload size={18} style={{ marginRight: '0.5rem' }} />
                Confirmar Importação de {importType === 'companies' ? 'Empresas' : importType === 'users' ? 'Clientes' : 'Chamados'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
