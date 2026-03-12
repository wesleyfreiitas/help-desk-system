'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { bulkImportClients } from '@/app/actions/admin';

export default function ImportClient() {
  const [data, setData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ created: number, updated: number, errors: string[] } | null>(null);

  const handleImport = async () => {
    if (!data.trim()) return;

    try {
      setIsProcessing(true);
      setResult(null);

      // Parse CSV-like format (semicolon or comma or tab)
      const rows = data.trim().split('\n');
      const clients = rows.map(row => {
        const parts = row.split(/[;,\t]/);
        return {
          name: parts[0]?.trim(),
          document: parts[1]?.trim(),
          email: parts[2]?.trim() || null,
          phone: parts[3]?.trim() || null,
          website: parts[4]?.trim() || null,
        };
      });

      const res = await bulkImportClients(clients);
      setResult(res);
      setData('');
    } catch (error: any) {
      alert(error.message || 'Erro ao importar dados');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Importar Empresas</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Cole os dados ou importe de uma planilha. Formato esperado: <br />
          <code>Razão Social ; CNPJ ; Email ; Telefone ; Website</code>
        </p>
      </div>

      <div className="card-body">
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            className="input-field"
            style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.9rem' }}
            placeholder="Exemplo:\nEmpresa ABC ; 12.345.678/0001-00 ; contato@abc.com ; (11) 99999-9999 ; www.abc.com"
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
                Confirmar Importação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
