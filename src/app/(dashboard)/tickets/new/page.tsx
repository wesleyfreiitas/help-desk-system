import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createTicket } from '@/app/actions/ticket';
import Link from 'next/link';
import Combobox from '@/components/Combobox';
import TicketDescriptionComposer from './TicketDescriptionComposer';

export default async function NewTicketPage(props: { searchParams: Promise<{ contactId?: string }> }) {
  const { contactId } = await props.searchParams;

  const session = await getSession();
  if (!session) return null;
  const user = session.user;

  const isInternalUser = !['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(user.role);

  // Contatos: usuários com role CLIENT (possuem clientId)
  const contacts = isInternalUser
    ? await prisma.user.findMany({
        where: { 
          role: { in: ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'] }, 
          deletedAt: null 
        },
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
  const allOptions = (await prisma.$queryRaw`SELECT * FROM "TicketOption" ORDER BY "order" ASC`) as any[];

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
                <Combobox 
                  name="contactId"
                  placeholder="Pesquisar contato por nome ou empresa..."
                  required
                  defaultValue={contactId || ""}
                  items={contacts.map((c: any) => ({
                    id: c.id,
                    label: c.name,
                    subLabel: c.client?.name
                  }))}
                />
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

          {isInternalUser && (
            <>
              {/* Tipo */}
              <div className="nt-field">
                <label className="nt-label">Tipo</label>
                <Combobox 
                  name="type"
                  placeholder="— Selecione o tipo —"
                  allowClear
                  items={typeOptions.map(opt => ({ id: opt.value, label: opt.label }))}
                />
              </div>

              {/* Fonte */}
              <div className="nt-field">
                <label className="nt-label">Fonte</label>
                <Combobox 
                  name="source"
                  defaultValue="Portal"
                  items={sourceOptions.map(opt => ({ id: opt.value, label: opt.label }))}
                />
              </div>

              {/* Status */}
              <div className="nt-field">
                <label className="nt-label">Status <span className="nt-required">*</span></label>
                <Combobox 
                  name="status"
                  defaultValue="ABERTO"
                  required
                  items={statusOptions.map(opt => ({ id: opt.value, label: opt.label }))}
                />
              </div>

              {/* Prioridade */}
              <div className="nt-field">
                <label className="nt-label">Prioridade <span className="nt-required">*</span></label>
                <Combobox 
                  name="priority"
                  defaultValue="BAIXA"
                  required
                  items={priorityOptions.map(opt => ({ id: opt.value, label: opt.label }))}
                />
              </div>
            </>
          )}

          {/* Categoria */}
          {isInternalUser && (
            <div className="nt-field">
              <label className="nt-label">CATEGORIA</label>
              {categories.length === 0 ? (
                <div className="nt-empty-field">Nenhuma categoria encontrada</div>
              ) : (
                <Combobox 
                  name="categoryId"
                  placeholder="— Sem categoria —"
                  allowClear
                  items={categories.map((cat: any) => ({
                    id: cat.id,
                    label: cat.name
                  }))}
                />
              )}
            </div>
          )}

          {/* Usuário (Agente) */}
          {isInternalUser && (
            <div className="nt-field">
              <label className="nt-label">USUÁRIO</label>
              <Combobox 
                name="assigneeId"
                placeholder="— Não atribuído —"
                defaultValue={user.id}
                allowClear
                items={agents.map((a: any) => ({
                  id: a.id,
                  label: a.name
                }))}
              />
            </div>
          )}

          {/* Produto */}
          <div className="nt-field">
            <label className="nt-label">Produto</label>
            <Combobox 
              name="productId"
              placeholder="— Selecione o produto —"
              allowClear
              items={products.map((p: any) => ({
                id: p.id,
                label: p.name
              }))}
            />
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
