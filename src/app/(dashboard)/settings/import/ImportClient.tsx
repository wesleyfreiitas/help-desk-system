'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, X, Play } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportClient({ organizationId }: { organizationId: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Map, 3: Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number; log: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field mapping state (CSV Column -> System Field)
  const [mapping, setMapping] = useState<Record<string, string>>({
    protocol: '',
    title: '',
    description: '',
    status: '',
    priority: '',
    requesterEmail: '',
    createdAt: ''
  });

  const systemFields = [
    { key: 'protocol', label: 'Protocolo', required: false },
    { key: 'title', label: 'Título / Assunto', required: true },
    { key: 'description', label: 'Mensagem / Descrição', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'priority', label: 'Prioridade', required: false },
    { key: 'type', label: 'Tipo', required: false },
    { key: 'requesterEmail', label: 'E-mail do Cliente', required: true },
    { key: 'companyName', label: 'Nome da Empresa/Cliente', required: false },
    { key: 'product', label: 'Produto', required: false },
    { key: 'category', label: 'Categoria', required: false },
    { key: 'assignedTo', label: 'Atendente', required: false },
    { key: 'createdAt', label: 'Data de Criação', required: false },
    { key: 'resolvedAt', label: 'Data de Finalização', required: false },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Por favor, selecione um arquivo CSV válido.');
      return;
    }
    
    setFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "ISO-8859-1", // Força leitura de caracteres especiais comuns em Excel BR
      complete: (results) => {
        if (results.meta.fields) {
          setColumns(results.meta.fields);
          setParsedData(results.data);
          
          // Auto-map columns if names are similar
          const autoMap = { ...mapping };
          results.meta.fields.forEach(field => {
            const lower = field.toLowerCase();
            if (lower.includes('titulo') || lower.includes('assunto') || lower.includes('title')) autoMap.title = field;
            if (lower.includes('desc') || lower.includes('mensagem')) autoMap.description = field;
            if (lower.includes('status') || lower.includes('situação')) autoMap.status = field;
            if (lower.includes('prioridade')) autoMap.priority = field;
            if (lower.includes('email') || lower.includes('e-mail')) autoMap.requesterEmail = field;
            if (lower.includes('protocolo') || lower.includes('id')) autoMap.protocol = field;
            if (lower.includes('data de criacao') || lower.includes('data de criação') || lower.includes('date')) autoMap.createdAt = field;
            if (lower.includes('produto')) autoMap.product = field;
            if (lower.includes('categoria')) autoMap.category = field;
            if (lower.includes('atendente') || lower.includes('responsável')) autoMap.assignedTo = field;
            if (lower.includes('tipo') || lower.includes('classificação')) autoMap.type = field;
            if (lower.includes('empresa') || lower.includes('cliente')) autoMap.companyName = field;
            if (lower.includes('finalizacao') || lower.includes('finalização') || lower.includes('fechado')) autoMap.resolvedAt = field;
          });
          setMapping(autoMap);
          setStep(2);
        }
      },
      error: (err) => {
        console.error('Error parsing CSV:', err);
        alert('Erro ao processar o arquivo CSV.');
      }
    });
  };

  const handleMappingChange = (systemField: string, csvColumn: string) => {
    setMapping(prev => ({ ...prev, [systemField]: csvColumn }));
  };

  const startImport = async () => {
    // Validate required fields
    const missing = systemFields.filter(f => f.required && !mapping[f.key]);
    if (missing.length > 0) {
      alert(`Por favor, mapeie os campos obrigatórios: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setStep(3);
    setIsProcessing(true);

    // Transform data based on mapping
    const payload = parsedData.map(row => {
      const item: any = {};
      Object.keys(mapping).forEach(sysKey => {
        const csvKey = mapping[sysKey];
        if (csvKey && row[csvKey]) {
          item[sysKey] = row[csvKey];
        }
      });
      return item;
    });

    try {
      // Call server action array payload
      const { importTickets } = await import('@/app/actions/import');
      const response = await importTickets(payload, organizationId || '');
      
      setResults(response);
      setIsProcessing(false);
      
    } catch (error: any) {
      setResults({
        success: 0,
        errors: payload.length,
        log: [error.message || 'Erro crítico durante a importação.']
      });
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setStep(1);
    setResults(null);
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 1 ? 1 : 0.5, fontWeight: step === 1 ? 600 : 400 }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 1 ? 'var(--primary-color)' : '#e2e8f0', color: step >= 1 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</div>
          <span>Upload</span>
        </div>
        <div style={{ height: '2px', flex: 1, background: step >= 2 ? 'var(--primary-color)' : '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 2 ? 1 : 0.5, fontWeight: step === 2 ? 600 : 400 }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 2 ? 'var(--primary-color)' : '#e2e8f0', color: step >= 2 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</div>
          <span>Validar & Mapear</span>
        </div>
        <div style={{ height: '2px', flex: 1, background: step >= 3 ? 'var(--primary-color)' : '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 3 ? 1 : 0.5, fontWeight: step === 3 ? 600 : 400 }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 3 ? 'var(--primary-color)' : '#e2e8f0', color: step >= 3 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</div>
          <span>Processar</span>
        </div>
      </div>

      {step === 1 && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '8px',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <UploadCloud size={48} color={isDragging ? 'var(--primary-color)' : 'var(--text-muted)'} style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Arraste seu arquivo CSV para cá</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ou clique para selecionar do seu computador</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={24} color="var(--primary-color)" />
              <div>
                <div style={{ fontWeight: 600 }}>{file?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{parsedData.length} registros encontrados</div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={resetProcess} style={{ padding: '0.5rem', height: 'auto' }}>
              <X size={18} />
            </button>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Mapeamento de Colunas</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Combine as colunas do seu arquivo CSV com os campos do sistema.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {systemFields.map(field => (
              <div key={field.key} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                </div>
                <select 
                  className="input" 
                  value={mapping[field.key] || ''} 
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Ignorar este campo --</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {mapping[field.key] && parsedData[0] && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Ex: {parsedData[0][mapping[field.key]]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={resetProcess}>Cancelar</button>
            <button className="btn btn-primary" onClick={startImport}>
              <Play size={16} />
              Iniciar Importação
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          {isProcessing ? (
            <div>
              <div className="spinner" style={{ margin: '0 auto', marginBottom: '1rem', width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Processando Importação...</h4>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Aguarde enquanto os registros são criados no banco de dados.</p>
            </div>
          ) : (
            <div style={{ animation: 'scaleIn 0.3s ease-out' }}>
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto', marginBottom: '1.5rem' }} />
              <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Importação Finalizada!</h4>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
                <div style={{ padding: '1rem 2rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#15803d' }}>{results?.success}</div>
                  <div style={{ color: '#166534', fontWeight: 500 }}>Registros Importados</div>
                </div>
                {results?.errors && results.errors > 0 ? (
                  <div style={{ padding: '1rem 2rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#b91c1c' }}>{results?.errors}</div>
                    <div style={{ color: '#991b1b', fontWeight: 500 }}>Erros Encontrados</div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={resetProcess}>Nova Importação</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </div>
  );
}
