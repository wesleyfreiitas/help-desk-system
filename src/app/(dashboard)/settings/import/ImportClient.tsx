'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Users, Building2 } from 'lucide-react';
import { bulkImportClients, bulkImportUsers } from '@/app/actions/admin';

type ImportType = 'companies' | 'users';

export default function ImportTool() {
  const [importType, setImportType] = useState<ImportType>('companies');
  const [data, setData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ created: number, updated: number, errors: string[] } | null>(null);

  const handleImport = async () => {
    if (!data.trim()) return;

    try {
      setIsProcessing(true);
      setResult(null);

      const rows = data.trim().split('\n');
      
      if (importType === 'companies') {
        const clients = rows.map(row => {
          const parts = row.split(/[;\t]/);
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
      } else {
        const users = rows.map(row => {
          const parts = row.split(/[;\t]/);
          return {
            name: parts[0]?.trim(),
            email: parts[1]?.trim(),
            phone: parts[2]?.trim() || null,
            companyDocument: parts[3]?.trim(), // Identificador Interno
            companyName: parts[6]?.trim(), // Organização
          };
        });
        const res = await bulkImportUsers(users);
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
            Importar Empresas
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
            Importar Clientes
          </button>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
          {importType === 'companies' ? 'Importação de Empresas' : 'Importação de Clientes (Usuários)'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Copie os dados do seu Excel e cole abaixo. <br />
          {importType === 'companies' ? (
            <><strong>Colunas esperadas:</strong> <code>Nome ; Email ; CNPJ ; Firewall ; IP ; Integrações ; Notas</code></>
          ) : (
            <><strong>Colunas esperadas:</strong> <code>Nome ; Email ; Telefone ; CNPJ Organização ; ... ; ... ; Nome Organização</code></>
          )}
        </p>
      </div>

      <div className="card-body">
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            className="input-field"
            style={{ minHeight: '350px', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre' }}
            placeholder={importType === 'companies' ? "Cole aqui as linhas de empresas..." : "Cole aqui as linhas de clientes..."}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 600 }}>{result.updated} atualizados</span>
              </div>
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
                Confirmar Importação de {importType === 'companies' ? 'Empresas' : 'Clientes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
