import { prisma } from './prisma';
import { logExternalApi, logSystemError } from './apiLogger';
import { recordAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export interface WebhookPayload {
  ticketId: string;
  message: string;
  source?: 'AI' | 'SYSTEM' | 'MANUAL';
  actions?: {
    status?: string;
    priority?: string;
    tags?: string;
    assigneeEmail?: string;
  };
}

export async function handleTicketEvent(payload: WebhookPayload, requestUrl: string = 'INTERNAL') {
  const { ticketId, message, source = 'SYSTEM', actions } = payload;

  try {
    // Log da requisição externa recebida
    await logExternalApi('TICKET-EVENT-HANDLER', requestUrl, 'POST', payload, 200, 'Processing');

    if (!ticketId || !message) {
      throw new Error('Missing ticketId or message');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignee: true }
    });

    if (!ticket) {
      await logExternalApi('TICKET-EVENT-HANDLER', requestUrl, 'POST', { ticketId }, 404, 'Ticket not found');
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    // --- 1. AÇÕES AUTOMÁTICAS ---
    if (actions && typeof actions === 'object') {
      const updateData: any = {};
      if (actions.status) updateData.status = actions.status;
      if (actions.priority) updateData.priority = actions.priority;
      if (actions.tags) updateData.tags = actions.tags;

      if (actions.assigneeEmail) {
        const targetUser = await prisma.user.findUnique({
          where: { email: actions.assigneeEmail }
        });
        if (targetUser) {
          updateData.assigneeId = targetUser.id;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: updateData
        });

        // Registrar auditoria das ações automáticas
        await recordAuditLog({
          action: 'UPDATE',
          resource: 'TICKET',
          resourceId: ticketId,
          details: { 
            info: `Ações automáticas executadas via ${source}`,
            changes: updateData 
          }
        });
      }
    }

    // --- 2. CRIAÇÃO DA NOTA INTERNA ---
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    const userId = ticket.assigneeId || adminUser?.id;

    if (!userId) {
      throw new Error('No user found for note attribution');
    }

    const interaction = await prisma.interaction.create({
      data: {
        ticketId,
        userId,
        message: message, // Salva a mensagem pura, sem prefixo
        isInternal: true,
        source: source
      }
    } as any);

    await recordAuditLog({
      action: 'CREATE',
      resource: 'TICKET_INTERACTION',
      resourceId: interaction.id,
      details: { ticketId, source: `WEBHOOK_${source}` }
    });

    revalidatePath(`/tickets/${ticketId}`);

    return { success: true, interactionId: interaction.id };
  } catch (err: any) {
    await logSystemError('TICKET-EVENT-HANDLER', err, { ticketId, url: requestUrl });
    console.error('Error in ticket event handler:', err);
    throw err;
  }
}
