import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from './prisma';
import { calculateSLA } from './sla';

export async function processInboundEmails() {
  const configRaw = await prisma.systemSetting.findUnique({
    where: { key: 'email_config' }
  });

  if (!configRaw) {
    console.error('Email config not found');
    return { success: false, error: 'Configuração de e-mail não encontrada.' };
  }

  const config = JSON.parse(configRaw.value);
  if (!config.imapHost || !config.imapPort || !config.imapUser || !config.imapPass) {
    return { success: false, error: 'Configuração IMAP incompleta.' };
  }

  const client = new ImapFlow({
    host: config.imapHost,
    port: parseInt(config.imapPort),
    secure: config.imapPort === '993',
    auth: {
      user: config.imapUser,
      pass: config.imapPass
    },
    logger: false
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Buscar mensagens não lidas
      const uids = await client.search({ seen: false });
      
      if (uids && Array.isArray(uids)) {
        for (const uid of uids) {
          const fetchResult = await client.fetchOne(uid.toString(), { source: true });
          if (!fetchResult || !fetchResult.source) continue;

          const parsed = await simpleParser(fetchResult.source);
          const subject = parsed.subject || '';
          const from = parsed.from?.value[0]?.address || '';
          const body = parsed.text || parsed.html || '';
          const messageId = parsed.messageId;
          const inReplyTo = parsed.inReplyTo;
          const references = Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : []);
          
          const to = parsed.to as any;
          const destination = Array.isArray(to?.value) ? to.value[0]?.address : config.imapUser;

          // Tentar extrair protocolo do assunto (ex: #1234)
          const protocolMatch = subject.match(/#(\d+)/);
          const protocol = protocolMatch ? protocolMatch[1] : null;

          let parentTicket = null;

          // 1. Tentar por protocolo (mais confiável)
          if (protocol) {
            parentTicket = await prisma.ticket.findUnique({ where: { protocol } });
          }

          // 2. Se não achou por protocolo, tentar por Threading (In-Reply-To / References)
          if (!parentTicket && (inReplyTo || references.length > 0)) {
            const threadIds = [inReplyTo, ...references].filter(Boolean) as string[];
            
            // Procurar se algum desses IDs é o messageId de um Ticket ou Interaction
            const existingTicket = await prisma.ticket.findFirst({
              where: { messageId: { in: threadIds } }
            });

            if (existingTicket) {
              parentTicket = existingTicket;
            } else {
              const existingInteraction = await prisma.interaction.findFirst({
                where: { messageId: { in: threadIds } },
                include: { ticket: true }
              });
              if (existingInteraction) {
                parentTicket = existingInteraction.ticket;
              }
            }
          }

          try {
            if (parentTicket) {
              // É uma resposta a um chamado existente
              const ticket = parentTicket;

            if (ticket) {
              // Encontrar ou criar usuário para o remetente
              let user = await prisma.user.findUnique({ where: { email: from } });
              if (!user) {
                // Se não existe, usamos o requerente original do chamado como fallback
                // ou criamos um log de erro se for preferencial
                user = await prisma.user.findFirst({ where: { id: ticket.requesterId || '' } }) as any;
              }

              if (user) {
                await prisma.interaction.create({
                  data: {
                    ticketId: ticket.id,
                    userId: user.id,
                    message: body,
                    isInternal: false,
                    messageId: messageId // Salva o ID deste e-mail para threads futuras
                  }
                });

                // Atualizar status se necessário
                if (ticket.status === 'AGUARDANDO_CLIENTE') {
                  await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { status: 'EM_ANDAMENTO', isSlaPaused: false }
                  });
                }

                await prisma.emailLog.create({
                  data: {
                    from,
                    to: destination,
                    subject,
                    type: 'RESPOSTA',
                    status: 'PROCESSADO',
                    messageId: messageId,
                    details: `Resposta adicionada ao chamado #${ticket.protocol}.`
                  }
                });
              } else {
                throw new Error('Usuário não identificado para processar resposta.');
              }
            } else {
              // Protocolo não encontrado
              await prisma.emailLog.create({
                data: {
                  from,
                  to: destination,
                  subject,
                  type: 'RESPOSTA',
                  status: 'REJEITADO',
                  details: `Protocolo #${protocol} não encontrado no sistema.`
                }
              });
            }
          } else {
            // É um novo chamado
            let user = await prisma.user.findUnique({ where: { email: from } });
            
            // Se o usuário não existe, precisamos de um cliente padrão ou rejeitar
            // Por enquanto, vamos buscar o primeiro cliente ativo como fallback ou rejeitar
            if (!user) {
              await prisma.emailLog.create({
                data: {
                  from,
                  to: destination,
                  subject,
                  type: 'CRIAÇÃO',
                  status: 'REJEITADO',
                  details: `Remetente ${from} não cadastrado como usuário.`
                }
              });
              continue;
            }

            if (!user.clientId) {
               await prisma.emailLog.create({
                data: {
                  from,
                  to: destination,
                  subject,
                  type: 'CRIAÇÃO',
                  status: 'REJEITADO',
                  details: `Usuário ${from} não está vinculado a nenhuma empresa.`
                }
              });
              continue;
            }

            // Gerar Novo Protocolo
            const lastTicket = await prisma.ticket.findFirst({ orderBy: { protocol: 'desc' } });
            let nextId = 1000 + (await prisma.ticket.count());
            if (lastTicket?.protocol) {
              const matched = lastTicket.protocol.match(/\d+/);
              if (matched) nextId = Math.max(nextId, parseInt(matched[0], 10));
            }
            const protocolString = `${nextId + 1}`;

            const { slaResolveDate, slaResponseDate } = calculateSLA('BAIXA');

            await prisma.ticket.create({
              data: {
                protocol: protocolString,
                title: subject,
                description: body,
                priority: 'BAIXA',
                status: 'ABERTO',
                source: 'E-mail',
                clientId: user.clientId,
                requesterId: user.id,
                slaResponseDate,
                slaResolveDate,
                messageId: messageId // Salva o ID deste e-mail inicial
              }
            });

            await prisma.emailLog.create({
              data: {
                from,
                to: destination,
                subject,
                type: 'CRIAÇÃO',
                status: 'PROCESSADO',
                messageId: messageId,
                details: `Novo chamado #${protocolString} criado com sucesso.`
              }
            });
          }

          // Marcar como lida (ou deletar, dependendo da política)
          await client.messageFlagsAdd(uid.toString(), ['\\Seen']);

        } catch (procError: any) {
          console.error('Error processing specific email:', procError);
          await prisma.emailLog.create({
            data: {
              from,
              to: destination,
              subject: subject || 'Sem Assunto',
              type: protocol ? 'RESPOSTA' : 'CRIAÇÃO',
              status: 'REJEITADO',
              details: `Erro interno no processamento: ${procError.message}`
            }
          });
        }
      }
    }
  } finally {
    lock.release();
  }

  await client.logout();
  return { success: true };
} catch (error: any) {
  console.error('IMAP Processing Error:', error);
  return { success: false, error: error.message };
}
}
