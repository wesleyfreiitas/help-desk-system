'use client';

import { useState } from 'react';
import { createClient } from '@/app/actions/admin';
import Link from 'next/link';
import MultiSelectDropdown from '@/app/components/MultiSelectDropdown';
import { useRouter } from 'next/navigation';

export default function NewClientForm({ customFields }: { customFields: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const target = e.currentTarget;
      const data = new FormData(target);
      
      // Add custom fields to formData
      Object.entries(customFieldValues).forEach(([id, value]) => {
        data.set(`cf_${id}`, value);
      });

      await createClient(data);
      router.push('/companies');
      router.refresh();
    } catch (error: any) {
      alert('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
         <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome Fantasia / Razão Social</label>
         <input type="text" id="name" name="name" required placeholder="Nome da empresa" className="form-control" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="document" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Documento (CNPJ/CPF)</label>
           <input type="text" id="document" name="document" required placeholder="00.000.000/0001-00" className="form-control" />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>E-mail de Contato</label>
           <input type="email" id="email" name="email" placeholder="contato@empresa.com" className="form-control" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telefone</label>
           <input type="text" id="phone" name="phone" placeholder="(11) 90000-0000" className="form-control" />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
           <label htmlFor="website" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Website</label>
           <input type="text" id="website" name="website" placeholder="https://www.empresa.com" className="form-control" />
        </div>
      </div>

      {customFields.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Campos Personalizados</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {customFields.map((field: any) => (
              <div key={field.id} className="form-group" style={{ marginBottom: 0, gridColumn: field.type === 'TEXTAREA' ? '1 / span 2' : 'auto' }}>
                <label className="form-label">{field.name}</label>
                {field.type === 'BOOLEAN' ? (
                  <select name={`cf_${field.id}`} className="form-control">
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                ) : field.type === 'SELECT' || field.type === 'MULTISELECT' ? (
                  field.type === 'MULTISELECT' ? (
                    <MultiSelectDropdown
                      options={field.options?.split(',').map((o: string) => o.trim()) || []}
                      selectedValues={customFieldValues[field.id]?.split(',').filter(Boolean) || []}
                      onChange={(values) => setCustomFieldValues(prev => ({ ...prev, [field.id]: values.join(',') }))}
                    />
                  ) : (
                    <select name={`cf_${field.id}`} className="form-control">
                      <option value="">Selecione...</option>
                      {field.options?.split(',').map((opt: string) => (
                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                      ))}
                    </select>
                  )
                ) : field.type === 'TEXTAREA' ? (
                  <textarea 
                    name={`cf_${field.id}`} 
                    className="form-control" 
                    placeholder="..." 
                    maxLength={300}
                  />
                ) : (
                  <input 
                    type={field.type === 'NUMBER' ? 'number' : 'text'} 
                    name={`cf_${field.id}`} 
                    placeholder="..." 
                    className="form-control"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
         <Link href="/companies" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1.5rem' }}>Cancelar</Link>
         <button type="submit" className="btn-primary" disabled={isSaving} style={{ width: 'auto', padding: '0.75rem 2.5rem' }}>
           {isSaving ? 'Salvando...' : 'Salvar Empresa'}
         </button>
      </div>

    </form>
  );
}
