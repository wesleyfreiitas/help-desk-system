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

  // --- Auto-seed Ticket Options granular (Option by Option) ---
  const ticketTypes = [
    { label: 'Pergunta', value: 'Pergunta', type: 'TYPE', order: 1 },
    { label: 'Incidente', value: 'Incidente', type: 'TYPE', order: 2 },
    { label: 'Problema', value: 'Problema', type: 'TYPE', order: 3 },
    { label: 'Solicitação de recurso', value: 'Solicitação de recurso', type: 'TYPE', order: 4 },
  ];
  for (const tt of ticketTypes) {
    const exists = await prisma.ticketOption.findFirst({ where: { type: 'TYPE', value: tt.value } });
    if (!exists) await prisma.ticketOption.create({ data: tt });
  }

  const ticketSources = [
    { label: 'Portal', value: 'Portal', type: 'SOURCE', order: 1 },
    { label: 'Email', value: 'Email', type: 'SOURCE', order: 2 },
    { label: 'Telefone', value: 'Telefone', type: 'SOURCE', order: 3 },
    { label: 'Chat', value: 'Chat', type: 'SOURCE', order: 4 },
    { label: 'WhatsApp', value: 'WhatsApp', type: 'SOURCE', order: 5 },
  ];
  for (const src of ticketSources) {
    const exists = await prisma.ticketOption.findFirst({ where: { type: 'SOURCE', value: src.value } });
    if (!exists) await prisma.ticketOption.create({ data: src });
  }

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
  for (const ts of ticketStatuses) {
    const exists = await prisma.ticketOption.findFirst({ where: { type: 'STATUS', value: ts.value } });
    if (!exists) await prisma.ticketOption.create({ data: ts });
  }

  const ticketPriorities = [
    { label: 'Baixa', value: 'BAIXA', type: 'PRIORITY', order: 1, color: '#10b981' },
    { label: 'Média', value: 'MEDIA', type: 'PRIORITY', order: 2, color: '#3b82f6' },
    { label: 'Alta', value: 'ALTA', type: 'PRIORITY', order: 3, color: '#f59e0b' },
    { label: 'Urgente', value: 'URGENTE', type: 'PRIORITY', order: 4, color: '#ef4444' },
  ];
  for (const tp of ticketPriorities) {
    const exists = await prisma.ticketOption.findFirst({ where: { type: 'PRIORITY', value: tp.value } });
    if (!exists) await prisma.ticketOption.create({ data: tp });
  }

  // Mapeamento em memória para evitar consultas desnecessárias
  const userCache: Record<string, string> = {};
  const companyCache: Record<string, string> = {};
  const productCache: Record<string, string> = {};
  const categoryCache: Record<string, string> = {};

  for (const row of payload) {
    let finalProtocol = '';
    try {
      if (!row.title) throw new Error('Título é obrigatório');

      // 1. Resolver Empresa (Baseado em nome do CSV)
      let clientIdToUse = clientId; // Default to main/current
      const companyName = row.companyName?.trim();
      if (companyName) {
        if (companyCache[companyName]) {
          clientIdToUse = companyCache[companyName];
        } else {
          let clientRecord = await prisma.client.findFirst({ where: { name: companyName } });
          if (!clientRecord) {
            clientRecord = await prisma.client.create({ data: { name: companyName, document: Math.random().toString().substring(2, 14) } });
          }
          companyCache[companyName] = clientRecord.id;
          clientIdToUse = clientRecord.id;
        }
      }

      // 2. Resolver Requester (Criar se não existir no Client)
      let requesterId = session.user.id;
      if (row.requesterEmail) {
        const email = row.requesterEmail.toLowerCase().trim();
        if (userCache[email]) {
          requesterId = userCache[email];
        } else {
          let userRow = await prisma.user.findUnique({ where: { email } });
          if (!userRow) {
            userRow = await prisma.user.create({
              data: {
                email,
                name: row.requesterName || email.split('@')[0],
                password: 'imported-password', 
                role: 'CLIENT',
                clientId: clientIdToUse
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

      // 5. Resolver Atendente (AssignedTo) - OPCIONAL baseado em Nome
      let assignedToId = null;
      const assigneeName = row.assignedTo?.trim();
      if (assigneeName && assigneeName.length > 2) {
        let assignee = await prisma.user.findFirst({ 
          where: { 
            name: { contains: assigneeName, mode: 'insensitive' }, 
            role: { in: ['ADMIN', 'ATTENDANT'] } 
          } 
        });
        if (assignee) {
          assignedToId = assignee.id;
        }
      }

      // 6. Parse de Datas
      const parseDateStr = (dateStr: string) => {
        if (!dateStr) return null;
        let d = dateStr;
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

      // 7. Montar o protocolo sequencial robusto
      if (row.protocol && row.protocol.trim() !== '') {
        // Se a planilha já trouxe, garantir formatação (ex: 19093 virar TKT-19093 para seguir padrao e evitar colisoes numericas puras)
        let rawProt = row.protocol.trim();
        if (/^\d+$/.test(rawProt)) {
           rawProt = `TKT-${rawProt}`;
        }
        finalProtocol = rawProt;
      } else {
        // Buscamos qual foi o último/maior ID salvo para iterar sobre ele
        // IMPORTANTE: TKT-9 seria maior que TKT-10 em string. Entao buscamos sem limite e pegamos o max no js
        const allTickets = await prisma.ticket.findMany({ select: { protocol: true } });
        let maxNumber = 1000;
        allTickets.forEach(t => {
           if(t.protocol) {
              const matched = t.protocol.match(/\d+/);
              if (matched) {
                 const num = parseInt(matched[0], 10);
                 if (num > maxNumber) maxNumber = num;
              }
           }
        });
        const nextProtocolNumber = maxNumber + 1 + successCount; 
        finalProtocol = `TKT-${nextProtocolNumber}`;
      }

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

      const rawType = row.type ? row.type.trim() : null; 
      const rawSource = row.source ? row.source.trim() : "Portal";

      // 9. Inserir no Banco
      await prisma.ticket.create({
        data: {
          protocol: finalProtocol,
          title: row.title,
          description: row.description || 'Importado via CSV',
          status: finalStatus as any,
          priority: finalPriority as any,
          type: rawType,
          source: rawSource,
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
      log.push(`Erro na linha (Título: ${row.title || 'Desconhecido'}) [Tentou Protocolo: ${finalProtocol}]: ${error.message}`);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/tickets');
  revalidatePath('/settings');

  return { success: successCount, errors: errorCount, log };
}
