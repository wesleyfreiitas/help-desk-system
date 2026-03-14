'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function importTickets(payload: any[], targetClientId: string) {
  const session = await getSession();
  if (!session || (session.role === 'CLIENT')) {
    throw new Error('Acesso negado.');
  }

  const clientId = targetClientId || session.clientId;
  if (!clientId) {
    throw new Error('ID do Cliente/Organização não definido.');
  }

  let successCount = 0;
  let errorCount = 0;
  const log: string[] = [];

  // Mapeamento em memória para evitar consultas desnecessárias de usuários pelo email
  const userCache: Record<string, string> = {};

  for (const row of payload) {
    try {
      // Validar dados básicos
      if (!row.title) {
        throw new Error('Título é obrigatório');
      }

      // 1. Resolver Requester (Solicitante) baseado no E-mail
      let requesterId: string | undefined = undefined;
      const email = row.requesterEmail?.trim().toLowerCase();
      
      if (email) {
        if (userCache[email]) {
          requesterId = userCache[email];
        } else {
          // Busca no banco
          let userRow = await prisma.user.findUnique({ where: { email } });
          
          if (!userRow) {
            // Cria um usuário simples se não existir
            userRow = await prisma.user.create({
              data: {
                name: email.split('@')[0], // placeholder name
                email,
                password: 'imported-user-no-login', // password dummy
                role: 'CLIENT',
                clientId: clientId
              }
            });
          }
          userCache[email] = userRow.id;
          requesterId = userRow.id;
        }
      }

      // 2. Parse da Data de Criação
      let createdAt = new Date();
      if (row.createdAt) {
        const parsedDate = new Date(row.createdAt);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }

      // 3. Montar o protocolo
      const protocolNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const finalProtocol = row.protocol && row.protocol.trim() !== '' ? row.protocol.trim() : `IMP-${protocolNumber}`;

      // 4. Status e Priority (Normalização Simples)
      const rawStatus = (row.status || '').toUpperCase();
      const validStatuses = ['ABERTO', 'EM_ANDAMENTO', 'PENDENTE', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_TERCEIRO', 'RESOLVIDO', 'FECHADO', 'CANCELADO'];
      const status = validStatuses.includes(rawStatus) ? rawStatus : 'ABERTO';

      const rawPriority = (row.priority || '').toUpperCase();
      const validPriorities = ['BAIXA', 'MEDIA', 'ALTA'];
      const priority = validPriorities.includes(rawPriority) ? rawPriority : 'MEDIA';

      // 5. Inserir no Banco
      await prisma.ticket.create({
        data: {
          protocol: finalProtocol,
          title: row.title,
          description: row.description || 'Importado via CSV',
          status,
          priority,
          createdAt,
          client: { connect: { id: clientId } },
          ...(requesterId ? { requester: { connect: { id: requesterId } } } : {})
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
