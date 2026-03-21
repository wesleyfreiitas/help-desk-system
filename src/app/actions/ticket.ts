'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateSLA } from '@/lib/sla';
import { redirect } from 'next/navigation';
import { sendTicketEmail } from '@/lib/mail';
import { assignTicket } from '@/lib/distribution';
import { recordAuditLog } from '@/lib/audit';

export async function addInteraction(ticketId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const message = formData.get('message') as string;
  const isInternal = formData.get('isInternal') === 'on';

  if (!message) return { error: 'Mensagem é obrigatória' };

  // Fetch ticket and user parallel to reduce round-trips
  const [ticket, userExists] = await Promise.all([
    prisma.ticket.findUnique({ where: { id: ticketId } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  ]);

  if (!ticket) return { error: 'Chamado não encontrado' };
  if (!userExists) {
    throw new Error('Sessão inválida. Faça logout e login novamente.');
  }

  // Processar anexos
  const files = formData.getAll('attachments') as File[];
  const validFiles = files.filter(file => file.name && file.size > 0);

  const interaction = await prisma.interaction.create({
    data: {
      ticketId,
      userId: session.user.id,
      message,
      isInternal: session.user.role === 'CLIENT' ? false : isInternal,
      attachments: {
        create: validFiles.map(file => ({
          filename: file.name,
          url: `/uploads/${file.name}`, // Simulação de URL
        }))
      }
    }
  });

  // Record Audit Log (Non-blocking)
  recordAuditLog({
    action: 'CREATE',
    resource: 'TICKET_INTERACTION',
    resourceId: interaction.id,
    details: { ticketId, isInternal: interaction.isInternal }
  });


  // Regras de Status automáticas baseadas em nova interação
  let newStatus = ticket.status;

  // Se for o cliente respondendo e estava aguardando cliente, volta para em andamento
  if (session.user.role === 'CLIENT' && ticket.status === 'AGUARDANDO_CLIENTE') {
    newStatus = 'EM_ANDAMENTO';
  }

  // Se for o primeiro atendimento, setar firstResponseAt
  const interactionsCount = await prisma.interaction.count({ where: { ticketId, isInternal: false } });

  let updateData: any = { status: newStatus };
  if (interactionsCount === 1 && session.user.role !== 'CLIENT' && !ticket.firstResponseAt) {
    updateData.firstResponseAt = new Date();
  }

  // Despausar SLA se estava pausado e voltou para em andamento (Simplificado)
  if (newStatus !== 'AGUARDANDO_CLIENTE' && ticket.isSlaPaused) {
    updateData.isSlaPaused = false;
    // Para ser 100% perfeito, o tempo que ficou pausado seria adicionado noslaResolveDate 
    // Adicionaremos 24h apenas para simplificar esse mock
    if (ticket.slaResolveDate) {
      updateData.slaResolveDate = new Date(ticket.slaResolveDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData
  });

  revalidatePath(`/tickets/${ticketId}`);
}

export async function changeTicketStatus(ticketId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const status = formData.get('status') as string;
  if (!status) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Chamado não encontrado');

  let updateData: any = { status };
  const now = new Date();

  // Time Tracking Logic
  if (status === 'EM_ANDAMENTO') {
    updateData.lastWorkStartedAt = now;
  } else if (ticket.status === 'EM_ANDAMENTO' && ticket.lastWorkStartedAt) {
    const elapsedSeconds = Math.floor((now.getTime() - ticket.lastWorkStartedAt.getTime()) / 1000);
    updateData.totalWorkTime = (ticket.totalWorkTime || 0) + elapsedSeconds;
    updateData.lastWorkStartedAt = null;
  }

  if (status === 'AGUARDANDO_CLIENTE') {
    updateData.isSlaPaused = true;
  } else if (ticket.isSlaPaused) {
    updateData.isSlaPaused = false;
  }

  if (status === 'RESOLVIDO' || status === 'FECHADO') {
    updateData.resolvedAt = now;
  }

  // Lógica de Reabertura
  if (['ABERTO', 'EM_ANDAMENTO', 'PENDENTE'].includes(status) && ['RESOLVIDO', 'FECHADO'].includes(ticket.status)) {
    updateData.reopenedCount = (ticket.reopenedCount || 0) + 1;
    updateData.resolvedAt = null; // Limpa data de resolução se reabriu
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData
  });

  recordAuditLog({
    action: 'UPDATE',
    resource: 'TICKET_STATUS',
    resourceId: ticketId,
    details: { oldStatus: ticket.status, newStatus: status }
  });

  revalidatePath(`/tickets/${ticketId}`);

  // Notificações por e-mail
  const fullTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { requester: true }
  });

  if (fullTicket) {
    if (['ABERTO', 'EM_ANDAMENTO'].includes(status) && ['RESOLVIDO', 'FECHADO'].includes(ticket.status)) {
      sendTicketEmail(fullTicket, 'REOPENED');
    } else if (status === 'RESOLVIDO') {
      sendTicketEmail(fullTicket, 'RESOLVED');
    }
  }
}

export async function createTicket(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = (formData.get('priority') as string) || 'BAIXA';
  const type = formData.get('type') as string | null;
  const status = (formData.get('status') as string) || 'ABERTO';
  const assigneeId = formData.get('assigneeId') as string | null;
  const categoryId = formData.get('categoryId') as string | null;
  const productId = formData.get('productId') as string | null;
  const contactId = formData.get('contactId') as string | null; // userId do contato

  let clientId: string | null = null;
  let requesterId: string | null = null;

  if (session.user.role === 'CLIENT') {
    // Cliente abrindo pelo portal
    clientId = session.user.clientId!;
    requesterId = session.user.id;
  } else {
    // Staff abrindo: derivar clientId do contato selecionado
    if (contactId) {
      const contact = await prisma.user.findUnique({
        where: { id: contactId },
        select: { id: true, clientId: true },
      });
      if (contact) {
        clientId = contact.clientId;
        requesterId = contact.id;
      }
    }
    // Se não selecionou contato, tenta usar clientId direto (fallback)
    if (!clientId) {
      const directClientId = formData.get('clientId') as string | null;
      clientId = directClientId;
    }
  }

  if (!title || !title.trim()) throw new Error('Assunto é obrigatório');
  if (!clientId) throw new Error('Contato é obrigatório');

  // Verificar se o cliente existe
  const clientExists = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!clientExists) throw new Error('Cliente não encontrado no banco de dados.');

  // Verificar se o usuário logado existe no banco
  const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });

  const { slaResolveDate, slaResponseDate } = calculateSLA(priority as 'ALTA' | 'MEDIA' | 'BAIXA');

  // Recupera o maior ticket já criado para fazer a contagem sequencial
  const lastTicket = await prisma.ticket.findFirst({
     orderBy: { protocol: 'desc' }
  });
  
  let nextId = 1000 + (await prisma.ticket.count());
  if (lastTicket && lastTicket.protocol) {
     const matched = lastTicket.protocol.match(/\d+/);
     if (matched) {
        const currentHigh = parseInt(matched[0], 10);
        if (currentHigh > nextId) {
            nextId = currentHigh;
        }
     }
  }
  const protocolNumber = nextId + 1;
  const finalProtocolString = `${protocolNumber}`;

  // Processar anexos do ticket inicial
  const files = formData.getAll('attachments') as File[];
  const validFiles = files.filter(file => file.name && file.size > 0);

  const source = formData.get('source') as string | null;

  const ticket = await prisma.ticket.create({
    data: {
      protocol: finalProtocolString,
      title: title.trim(),
      description,
      priority: priority as 'ALTA' | 'MEDIA' | 'BAIXA',
      status,
      type: type || null,
      source: source || 'Portal',
      clientId,
      requesterId,
      assigneeId: assigneeId || null,
      categoryId: categoryId || null,
      productId: productId || null,
      ...(userExists ? { createdById: session.user.id } : {}),
      slaResponseDate,
      slaResolveDate,
    } as any
  });

  recordAuditLog({
    action: 'CREATE',
    resource: 'TICKET',
    resourceId: ticket.id,
    details: { protocol: ticket.protocol, title: ticket.title }
  });

  // Salvar anexos (vinculados a uma interação inicial ou ao ticket se houver relação direto)
  // No nosso schema, Attachment pertence a Interaction. 
  // Então vamos criar uma interação inicial "abertura do chamado" com os anexos.
  if (validFiles.length > 0) {
    await prisma.interaction.create({
      data: {
        ticketId: ticket.id,
        userId: session.user.id,
        message: "Arquivo(s) anexado(s) na abertura do chamado.",
        isInternal: true,
        source: "SYSTEM",
        attachments: {
          create: validFiles.map(file => ({
            filename: file.name,
            url: `/uploads/${file.name}`,
          }))
        }
      }
    });
  }


  // Buscar informações do solicitante para o e-mail
  const ticketWithRequester = await prisma.ticket.findUnique({
    where: { id: ticket.id },
    include: { requester: true }
  });

  if (ticketWithRequester) {
    sendTicketEmail(ticketWithRequester, 'NEW');
  }

  // Atribuição Automática (somente se status for ABERTO e não tiver atendente)
  if (status === 'ABERTO' && !assigneeId) {
    assignTicket(ticket.id);
  }

  redirect(`/tickets/${ticket.id}`);
}


export async function updateTicketField(ticketId: string, field: string, value: string | null) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const user = session.user;
  if (user.role === 'CLIENT') {
    throw new Error('Unauthorized: Clientes não podem alterar estas propriedades');
  }

  // Allowed fields check
  const allowedFields = ['productId', 'categoryId', 'assigneeId', 'status', 'priority', 'type', 'tags', 'source', 'departmentId'];
  if (!allowedFields.includes(field)) {
    throw new Error('Invalid field update');
  }

  const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!currentTicket) throw new Error('Ticket not found');

  const data: any = {};
  data[field] = value;

  // Status-specific logic (Time tracking, SLA, Resolved date)
  if (field === 'status' && value) {
    const now = new Date();

    // Time Tracking
    if (value === 'EM_ANDAMENTO') {
      data.lastWorkStartedAt = now;
    } else if (currentTicket.status === 'EM_ANDAMENTO' && currentTicket.lastWorkStartedAt) {
      const elapsedSeconds = Math.floor((now.getTime() - currentTicket.lastWorkStartedAt.getTime()) / 1000);
      data.totalWorkTime = (currentTicket.totalWorkTime || 0) + elapsedSeconds;
      data.lastWorkStartedAt = null;
    }

    // SLA / Resolved
    if (value === 'AGUARDANDO_CLIENTE') {
      data.isSlaPaused = true;
    } else if (currentTicket.isSlaPaused) {
      data.isSlaPaused = false;
    }

    if (value === 'RESOLVIDO' || value === 'FECHADO') {
      data.resolvedAt = now;
    }

    // Lógica de Reabertura
    if (['ABERTO', 'EM_ANDAMENTO', 'PENDENTE'].includes(value) && ['RESOLVIDO', 'FECHADO'].includes(currentTicket.status)) {
      data.reopenedCount = (currentTicket.reopenedCount || 0) + 1;
      data.resolvedAt = null;
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data,
    include: {
      client: true,
      product: true,
      category: true,
      assignee: true,
      requester: true,
    }
  });

  recordAuditLog({
    action: 'UPDATE',
    resource: 'TICKET_FIELD',
    resourceId: ticketId,
    details: { field, value, oldStatus: currentTicket.status }
  });

  // Notificações por e-mail
  if (field === 'status' && value) {
    if (['ABERTO', 'EM_ANDAMENTO'].includes(value) && ['RESOLVIDO', 'FECHADO'].includes(currentTicket.status)) {
      sendTicketEmail(ticket, 'REOPENED');
    } else if (value === 'RESOLVIDO') {
      sendTicketEmail(ticket, 'RESOLVED');
    }
  }

  // Log opcional de quem mudou o que (descomente ou ajuste via interações internas se desejado)
  /*
  await prisma.interaction.create({
    data: {
      ticketId,
      userId: user.id,
      message: `Alterou o campo ${field}`,
      isInternal: true
    }
  });
  */

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${ticketId}`);

  return ticket;
}

export async function bulkUpdateStatus(ticketIds: string[], status: string) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.ticket.updateMany({
    where: { id: { in: ticketIds } },
    data: { status, resolvedAt: (status === 'RESOLVIDO' || status === 'FECHADO') ? new Date() : undefined }
  });

  for (const id of ticketIds) {
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'TICKET_STATUS',
      resourceId: id,
      details: { newStatus: status, bulk: true }
    });
  }

  revalidatePath('/tickets');
}

export async function bulkAssign(ticketIds: string[], assigneeId: string | null) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.ticket.updateMany({
    where: { id: { in: ticketIds } },
    data: { assigneeId }
  });

  for (const id of ticketIds) {
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'TICKET_ASSIGNEE',
      resourceId: id,
      details: { assigneeId, bulk: true }
    });
  }

  revalidatePath('/tickets');
}

export async function bulkDelete(ticketIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.ticket.updateMany({
    where: { id: { in: ticketIds } },
    data: { deletedAt: new Date() }
  });

  for (const id of ticketIds) {
    await recordAuditLog({
      action: 'DELETE',
      resource: 'TICKET',
      resourceId: id
    });
  }

  revalidatePath('/tickets');
}

export async function bulkMerge(ticketIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  if (ticketIds.length < 2) throw new Error('Selecione ao menos 2 chamados para mesclar');

  // Encontrar o mais antigo
  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ticketIds } },
    orderBy: { createdAt: 'asc' }
  });

  const oldest = tickets[0];
  const others = tickets.slice(1);

  // Fechar os outros e adicionar mensagem de link
  for (const t of others) {
    await prisma.ticket.update({
      where: { id: t.id },
      data: { status: 'FECHADO', resolvedAt: new Date() }
    });

    await prisma.interaction.create({
      data: {
        ticketId: t.id,
        userId: session.user.id,
        message: `Este chamado foi mesclado ao chamado <a href="/tickets/${oldest.id}" class="nt-link">#${oldest.protocol}</a>.`,
        isInternal: true,
        source: "SYSTEM"
      }
    });

    // Opcional: Adicionar uma interação no chamado antigo avisando que recebeu um merge
    await prisma.interaction.create({
      data: {
        ticketId: oldest.id,
        userId: session.user.id,
        message: `O chamado <a href="/tickets/${t.id}" class="nt-link">#${t.protocol}</a> foi mesclado a este.`,
        isInternal: true,
        source: "SYSTEM"
      }
    });

    await recordAuditLog({
      action: 'UPDATE',
      resource: 'TICKET_MERGE',
      resourceId: t.id,
      details: { mergedInto: oldest.id }
    });
  }

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${oldest.id}`);

  return oldest.id;
}

export async function bulkUpdateTickets(
  ticketIds: string[],
  status?: string,
  priority?: string,
  message?: string,
  isInternal: boolean = true
) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const now = new Date();

  for (const id of ticketIds) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) continue;

    const updateData: any = {};
    if (status) {
      updateData.status = status;

      // Time Tracking logic from changeTicketStatus/updateTicketField
      if (status === 'EM_ANDAMENTO') {
        updateData.lastWorkStartedAt = now;
      } else if (ticket.status === 'EM_ANDAMENTO' && ticket.lastWorkStartedAt) {
        const elapsedSeconds = Math.floor((now.getTime() - ticket.lastWorkStartedAt.getTime()) / 1000);
        updateData.totalWorkTime = (ticket.totalWorkTime || 0) + elapsedSeconds;
        updateData.lastWorkStartedAt = null;
      }

      if (status === 'AGUARDANDO_CLIENTE') {
        updateData.isSlaPaused = true;
      } else if (ticket.isSlaPaused) {
        updateData.isSlaPaused = false;
      }

      if (status === 'RESOLVIDO' || status === 'FECHADO') {
        updateData.resolvedAt = now;
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.ticket.update({
        where: { id },
        data: updateData
      });
    }

    if (Object.keys(updateData).length > 0 || message) {
      await recordAuditLog({
        action: 'UPDATE',
        resource: 'TICKET_BULK',
        resourceId: id,
        details: { status, priority, message: !!message }
      });
    }
  }

  revalidatePath('/tickets');
}
