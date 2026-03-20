'use client';

import { useState } from 'react';
import { 
    Mail, 
    Phone, 
    Tag, 
    Globe, 
    ExternalLink, 
    ChevronUp, 
    ChevronDown,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import ClickToCallButton from '@/components/ClickToCallButton';
import WhatsAppButton from '@/app/(dashboard)/users/[id]/WhatsAppButton';

interface Props {
    user: any;
}

export default function UserContactSidebar({ user }: Props) {
    const [contatoOpen, setContatoOpen] = useState(true);
    const [empresaOpen, setEmpresaOpen] = useState(true);
    const [deptOpen, setDeptOpen] = useState(true);

    const userCustomFields = user.customFields?.filter((cf: any) => cf.field.target === 'USER') || [];
    const clientCustomFields = user.client?.customFields?.filter((cf: any) => cf.field.target === 'CLIENT') || [];

    return (
        <div className="tc-sidebar">
            {/* Seção Contato */}
            <div className="tc-section">
                <button className="tc-section-title" onClick={() => setContatoOpen(o => !o)}>
                    <span>CONTATO</span>
                    {contatoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {contatoOpen && (
                    <div className="tc-section-body">
                        <div className="tc-row">
                            <Mail size={15} className="tc-row-icon" />
                            <div className="tc-row-content">
                                <span className="tc-row-label">EMAIL</span>
                                <span className="tc-row-value">{user.email}</span>
                            </div>
                        </div>

                        {user.phone && (
                            <div className="tc-row">
                                <Phone size={15} className="tc-row-icon" />
                                <div className="tc-row-content">
                                    <span className="tc-row-label">TELEFONE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span className="tc-row-value">{user.phone}</span>
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <ClickToCallButton phone={user.phone} />
                                            <WhatsAppButton phone={user.phone} contactName={user.name} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.extension && (
                            <div className="tc-row">
                                <Phone size={15} className="tc-row-icon" />
                                <div className="tc-row-content">
                                    <span className="tc-row-label">RAMAL (UPPHONE)</span>
                                    <span className="tc-row-value">{user.extension}</span>
                                </div>
                            </div>
                        )}

                        {userCustomFields.map((cf: any) => (
                            <div key={cf.id} className="tc-row">
                                <Tag size={15} className="tc-row-icon" />
                                <div className="tc-row-content">
                                    <span className="tc-row-label">{cf.field.name.toUpperCase()}</span>
                                    <span className="tc-row-value">{cf.value || '--'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Departamentos - Apenas para ADMIN/ATTENDANT */}
            {(user.role === 'ADMIN' || user.role === 'ATTENDANT') && (
                <div className="tc-section">
                    <button className="tc-section-title" onClick={() => setDeptOpen(o => !o)}>
                        <span>DEPARTAMENTOS</span>
                        {deptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {deptOpen && (
                        <div className="tc-section-body">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(user.departments && user.departments.length > 0) ? (
                                    user.departments.map((dm: any) => (
                                        <Link 
                                            key={dm.id} 
                                            href={`/departments/${dm.department.id}`}
                                            className="tc-link"
                                            style={{ 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600, 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                background: 'var(--bg-elevated)', 
                                                border: `1px solid ${dm.department.color || '#6366f1'}4d`,
                                                borderLeft: `3px solid ${dm.department.color || '#6366f1'}`,
                                                color: 'var(--text-main)'
                                            }}
                                        >
                                            {dm.department.name} {dm.isLeader && '👑'}
                                        </Link>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Nenhum departamento
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empresa */}
            {user.client && (
                <div className="tc-section">
                    <button className="tc-section-title" onClick={() => setEmpresaOpen(o => !o)}>
                        <span>EMPRESA</span>
                        {empresaOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {empresaOpen && (
                        <div className="tc-section-body" style={{ gap: '1rem' }}>
                            <div className="tc-row">
                                <Building2 size={15} className="tc-row-icon" />
                                <div className="tc-row-content">
                                    <span className="tc-row-label">RAZÃO SOCIAL</span>
                                    <Link href={`/companies/${user.client.id}`} className="tc-row-value tc-link" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                        {user.client.name}
                                    </Link>
                                </div>
                            </div>

                            <div className="tc-field">
                                <span className="tc-row-label">CNPJ / DOCUMENTO</span>
                                <span className="tc-row-value">{user.client.document || '--'}</span>
                            </div>

                            {user.client.website && (
                                <div className="tc-row">
                                    <Globe size={15} className="tc-row-icon" />
                                    <div className="tc-row-content">
                                        <span className="tc-row-label">WEBSITE</span>
                                        <a 
                                            href={user.client.website.startsWith('http') ? user.client.website : `https://${user.client.website}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="tc-row-value tc-link"
                                            style={{ color: 'var(--primary)', fontWeight: 600 }}
                                        >
                                            {user.client.website}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Campos Adicionais da Empresa */}
                            {clientCustomFields.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {clientCustomFields.map((cf: any) => (
                                            <div key={cf.id} className="tc-field">
                                                <span className="tc-row-label">{cf.field.name.toUpperCase()}</span>
                                                <span className="tc-row-value">{cf.value || '--'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
