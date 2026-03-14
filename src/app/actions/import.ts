'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function importTickets(payload: any[], targetClientId: string) {
  const session = await getSession();
  if (!session || !session.user || session.user.role === 'CLIENT') {
    throw new Error('Acesso negado.');
  }

  let clientId = targetClientId || session.user.clientId;
  
  if (!clientId) {
    if (session.user.role === 'ADMIN') {
      const firstClient = await prisma.client.findFirst();
      if (firstClient) {
        clientId = firstClient.id;
      } else {
        const dummyClient = await prisma.client.create({ data: { name: 'Organização Principal', document: '000' } });
        clientId = dummyClient.id;
      }
    } else {
      throw new Error('ID da Organização não definido para o usuário atual.');
    }
  }

  let successCount = 0;
  let errorCount = 0;
  const log: string[] = [];

  // --- Auto-seed Ticket Options se o banco estiver vazio ---
  const existingOptionsCount = await prisma.ticketOption.count();
  if (existingOptionsCount === 0) {
    const ticketTypes = [
      { label: 'Pergunta', value: 'Pergunta', type: 'TYPE', order: 1 },
      { label: 'Incidente', value: 'Incidente', type: 'TYPE', order: 2 },
      { label: 'Problema', value: 'Problema', type: 'TYPE', order: 3 },
      { label: 'Solicitação de recurso', value: 'Solicitação de recurso', type: 'TYPE', order: 4 },
    ];
    for (const tt of ticketTypes) await prisma.ticketOption.create({ data: tt });

    const ticketStatuses = [
      { label: 'Aberto', value: 'ABERTO', type: 'STATUS', order: 1, color: '#e0f2fe' },
      { label: 'Em Andamento', value: 'EM_ANDAMENTO', type: 'STATUS', order: 2, color: '#fed7aa' },
      { label: 'Pendente', value: 'PENDENTE', type: 'STATUS', order: 3, color: '#fef3c7' },
      { label: 'Resolvido', value: 'RESOLVIDO', type: 'STATUS', order: 4, color: '#dcfce3' },
      { label: 'Fechado', value: 'FECHADO', type: 'STATUS', order: 5, color: '#f1f5f9' },
      { label: 'Aguardando cliente', value: 'AGUARDANDO_CLIENTE', type: 'STATUS', order: 6, color: '#fce7f3' },
      { label: 'Aguardando terceiros', value: 'AGUARDANDO_TERCEIRO', type: 'STATUS', order: 7, color: '#f1f5f9' },
      { label: 'Cancelado', value: 'CANCELADO', type: 'STATUS', order: 8, color: '#fee2e2' },
    ];
    for (const ts of ticketStatuses) await prisma.ticketOption.create({ data: ts });

    const ticketPriorities = [
      { label: 'Baixa', value: 'BAIXA', type: 'PRIORITY', order: 1, color: '#10b981' },
      { label: 'Média', value: 'MEDIA', type: 'PRIORITY', order: 2, color: '#3b82f6' },
      { label: 'Alta', value: 'ALTA', type: 'PRIORITY', order: 3, color: '#f59e0b' },
      { label: 'Urgente', value: 'URGENTE', type: 'PRIORITY', order: 4, color: '#ef4444' },
    ];
    for (const tp of ticketPriorities) await prisma.ticketOption.create({ data: tp });
  }

  // Mapeamento em memória para evitar consultas desnecessárias
  const userCache: Record<string, string> = {};
  const companyCache: Record<string, string> = {};
  const productCache: Record<string, string> = {};
  const categoryCache: Record<string, string> = {};

  for (const row of payload) {
    try {
      if (!row.title) throw new Error('Título é obrigatório');

      // 1. Ignorando criação de Empresa (Company/Client individual) pois
      // no schema atual: Tickets vinculam a 1 Client raiz (clientId) e 1 Requester (User).
      // A importação deve forçar o vinculo com a conta atual do Painel (clientId).

      // 2. Resolver Requester (Solicitante)
      let requesterId: string | undefined = undefined;
      const email = row.requesterEmail?.trim().toLowerCase();
      if (email) {
        if (userCache[email]) {
          requesterId = userCache[email];
        } else {
          let userRow = await prisma.user.findUnique({ where: { email } });
          if (!userRow) {
            userRow = await prisma.user.create({
              data: {
                name: email.split('@')[0],
                email,
                password: 'imported-user-no-login',
                role: 'CLIENT',
                clientId: clientId
              }
            });
          }
          userCache[email] = userRow.id;
          requesterId = userRow.id;
        }
      }

      // 3. Resolver Produto - OPCIONAL
      let productId = null;
      const productName = row.product?.trim();
      if (productName) {
        if (productCache[productName]) {
          productId = productCache[productName];
        } else {
          let product = await prisma.product.findFirst({ where: { name: productName } });
          if (!product) {
            product = await prisma.product.create({ data: { name: productName } });
          }
          productCache[productName] = product.id;
          productId = product.id;
        }
      }

      // 4. Resolver Categoria - OPCIONAL
      let categoryId = null;
      const categoryName = row.category?.trim();
      if (categoryName) {
        if (categoryCache[categoryName]) {
          categoryId = categoryCache[categoryName];
        } else {
          let category = await prisma.category.findFirst({ where: { name: categoryName } });
          if (!category) {
            category = await prisma.category.create({ data: { name: categoryName } });
          }
          categoryCache[categoryName] = category.id;
          categoryId = category.id;
        }
      }

      // 5. Resolver Atendente (AssignedTo) - OPCIONAL baseado em Nome (como parece ser na planilha)
      let assignedToId = null;
      const assigneeName = row.assignedTo?.trim();
      if (assigneeName) {
        let assignee = await prisma.user.findFirst({ where: { name: { equals: assigneeName, mode: 'insensitive' }, clientId, role: { in: ['ATTENDANT', 'ORG_MEMBER', 'ORG_MANAGER', 'ADMIN'] } } });
        if (assignee) {
          assignedToId = assignee.id;
        }
      }

      // 6. Parse de Datas (Suporte para formato BR DD/MM/YYYY)
      const parseDateStr = (dateStr: string) => {
        if (!dateStr) return null;
        let d = dateStr;
        // DD/MM/YYYY HH:MM
        if (d.includes('/')) {
          const parts = d.split(' ');
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
             d = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}${parts[1] ? 'T' + parts[1] + ':00Z' : 'T00:00:00Z'}`;
          }
        }
        const parsedNode = new Date(d);
        return isNaN(parsedNode.getTime()) ? null : parsedNode;
      };

      let createdAt = parseDateStr(row.createdAt) || new Date();
      let resolvedAt = parseDateStr(row.resolvedAt);

      // 7. Montar o protocolo
      const protocolNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const finalProtocol = row.protocol && row.protocol.trim() !== '' ? row.protocol.trim() : `IMP-${protocolNumber}`;

      // 8. Normalização Avançada de Status, Prioridade e Tipo
      const normalizeStr = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
      
      const rawStatus = normalizeStr(row.status);
      const isClosed = rawStatus.includes('FECHAD') || rawStatus.includes('RESOLVID') || rawStatus.includes('FINALIZ');
      
      let finalStatus = 'ABERTO';
      if (['ABERTO', 'NOVO'].includes(rawStatus)) finalStatus = 'ABERTO';
      else if (['EM_ANDAMENTO', 'EM ANDAMENTO', 'ANDAMENTO'].includes(rawStatus)) finalStatus = 'EM_ANDAMENTO';
      else if (['PENDENTE', 'ESPERA'].includes(rawStatus)) finalStatus = 'PENDENTE';
      else if (['RESPOSTA', 'AGUARDANDO CLIENTE'].includes(rawStatus)) finalStatus = 'AGUARDANDO_CLIENTE';
      else if (['TERCEIRO', 'AGUARDANDO TERCEIRO'].includes(rawStatus)) finalStatus = 'AGUARDANDO_TERCEIRO';
      else if (rawStatus.includes('RESOLVID')) finalStatus = 'RESOLVIDO';
      else if (rawStatus.includes('FECHAD')) finalStatus = 'FECHADO';
      else if (rawStatus.includes('CANCELAD')) finalStatus = 'CANCELADO';
      else finalStatus = isClosed ? 'FECHADO' : 'ABERTO';

      const rawPriority = normalizeStr(row.priority);
      let finalPriority = 'MEDIA';
      if (['BAIXA', 'BAIXO'].includes(rawPriority)) finalPriority = 'BAIXA';
      else if (['MEDIA', 'MEDIO', 'NORMAL'].includes(rawPriority)) finalPriority = 'MEDIA';
      else if (['ALTA', 'ALTO'].includes(rawPriority)) finalPriority = 'ALTA';
      else if (['URGENTE', 'CRITICA', 'CRITICO'].includes(rawPriority)) finalPriority = 'URGENTE';

      const rawType = row.type ? row.type.trim() : null; // Apenas repassamos. A interface trata os valores corretos.

      // 9. Inserir no Banco
      await prisma.ticket.create({
        data: {
          protocol: finalProtocol,
          title: row.title,
          description: row.description || 'Importado via CSV',
          status: finalStatus as any,
          priority: finalPriority as any,
          type: rawType,
          createdAt,
          ...(resolvedAt ? { resolvedAt } : {}),
          client: { connect: { id: clientId } },
          ...(requesterId ? { requester: { connect: { id: requesterId } } } : {}),
          ...(productId ? { product: { connect: { id: productId } } } : {}),
          ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
          ...(assignedToId ? { assignee: { connect: { id: assignedToId } } } : {})
        }
      });

      successCount++;
    } catch (error: any) {
      errorCount++;
      log.push(`Erro na linha (Título: ${row.title || 'Desconhecido'}): ${error.message}`);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/tickets');
  revalidatePath('/settings');

  return { success: successCount, errors: errorCount, log };
}
