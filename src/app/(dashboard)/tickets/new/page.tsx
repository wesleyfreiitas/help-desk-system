import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createTicket } from '@/app/actions/ticket';
import Link from 'next/link';

import TicketDescriptionComposer from './TicketDescriptionComposer';

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  const isInternalUser = user.role !== 'CLIENT';

  // Contatos: usuários com role CLIENT (possuem clientId)
  const contacts = isInternalUser
    ? await prisma.user.findMany({
        where: { role: 'CLIENT', deletedAt: null },
        include: { client: true },
        orderBy: { name: 'asc' },
      })
    : [];

  // Grupos (categorias)
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });

  // Agentes (ADMIN + ATTENDANT)
  const agents = isInternalUser
    ? await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'ATTENDANT'] }, deletedAt: null },
        orderBy: { name: 'asc' },
      })
    : [];

  // Produtos
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });

  // Opções Dinâmicas
  const allOptions = (await prisma.$queryRaw`SELECT * FROM TicketOption ORDER BY "order" ASC`) as any[];

  const typeOptions = allOptions.filter(o => o.type === 'TYPE');
  const sourceOptions = allOptions.filter(o => o.type === 'SOURCE');
  const statusOptions = allOptions.filter(o => o.type === 'STATUS');
  const priorityOptions = allOptions.filter(o => o.type === 'PRIORITY');

  return (
    <div className="new-ticket-wrapper">
      <form action={createTicket} className="new-ticket-form" encType="multipart/form-data">

        {/* Cabeçalho */}
        <div className="new-ticket-header">
          <h2 className="new-ticket-title">Novo Chamado</h2>
        </div>

        <div className="new-ticket-body">

          {/* Contato */}
          {isInternalUser && (
            <div className="nt-field">
              <label className="nt-label">Contato <span className="nt-required">*</span></label>
              <div className="nt-contact-row">
                <select name="contactId" className="nt-select" required>
                  <option value="">— Selecione o contato —</option>
                  {contacts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.client ? ` (${c.client.name})` : ''}
                    </option>
                  ))}
                </select>
                <div className="nt-contact-links">
                  <Link href="/users/new" className="nt-link">Adicionar novo contato</Link>
                </div>
              </div>
            </div>
          )}

          {/* Assunto */}
          <div className="nt-field">
            <label className="nt-label">Assunto <span className="nt-required">*</span></label>
            <input
              type="text"
              name="title"
              className="nt-input"
              required
              placeholder=""
            />
          </div>

          {/* Tipo */}
          <div className="nt-field">
            <label className="nt-label">Tipo</label>
            <select name="type" className="nt-select">
              <option value="">--</option>
              {typeOptions.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Fonte */}
          <div className="nt-field">
            <label className="nt-label">Fonte</label>
            <select name="source" className="nt-select" defaultValue="Portal">
              {sourceOptions.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="nt-field">
            <label className="nt-label">Status <span className="nt-required">*</span></label>
            <select name="status" className="nt-select" defaultValue="ABERTO">
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div className="nt-field">
            <label className="nt-label">Prioridade <span className="nt-required">*</span></label>
            <select name="priority" className="nt-select" defaultValue="BAIXA">
              {priorityOptions.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          {isInternalUser && (
            <div className="nt-field">
              <label className="nt-label">CATEGORIA</label>
              {categories.length === 0 ? (
                <div className="nt-empty-field">Nenhuma categoria encontrada</div>
              ) : (
                <select name="categoryId" className="nt-select">
                  <option value="">— Sem categoria —</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Usuário (Agente) */}
          {isInternalUser && (
            <div className="nt-field">
              <label className="nt-label">USUÁRIO</label>
              <select name="assigneeId" className="nt-select" defaultValue={user.id}>
                <option value="">— Não atribuído —</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Produto */}
          <div className="nt-field">
            <label className="nt-label">Produto</label>
            <select name="productId" className="nt-select">
              <option value="">— Selecione —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div className="nt-field">
            <label className="nt-label">Descrição <span className="nt-required">*</span></label>
            <TicketDescriptionComposer />
          </div>

        </div>

        {/* Rodapé móvel (mobile) */}
        <div className="new-ticket-footer">
          <div className="nt-footer-actions">
            <Link href="/tickets" className="btn-outline">Cancelar</Link>
            <button type="submit" className="btn-primary">Criar</button>
          </div>
        </div>

      </form>
    </div>
  );
}
