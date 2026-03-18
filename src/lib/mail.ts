import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function getEmailTransporter() {
  const configRaw = await prisma.systemSetting.findUnique({
    where: { key: 'email_config' }
  });

  if (!configRaw) {
    return null;
  }

  const config = JSON.parse(configRaw.value);
  if (!config.host || !config.port || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: parseInt(config.port),
    secure: config.port === '465', // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendEmail({ to, subject, html, messageId, inReplyTo, references }: { to: string, subject: string, html: string, messageId?: string, inReplyTo?: string, references?: string | string[] }) {
  const transporter = await getEmailTransporter();
  
  if (!transporter) {
    console.warn('E-mail service not configured. Logging to console instead.');
    console.log(`\n--- VIRTUAL EMAIL ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    console.log(`----------------------\n`);
    return { success: false, error: 'Serviço de e-mail não configurado.' };
  }

  const configRaw = await prisma.systemSetting.findUnique({
    where: { key: 'email_config' }
  });
  const config = JSON.parse(configRaw!.value);

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName || 'Upp HelpDesk'}" <${config.fromEmail || config.user}>`,
      to,
      subject,
      html,
      messageId,
      inReplyTo,
      references
    });

    // Log do e-mail de saída
    await prisma.emailLog.create({
      data: {
        from: config.fromEmail || config.user,
        to,
        subject,
        type: 'NOTIFICAÇÃO',
        status: 'PROCESSADO',
        messageId: info.messageId,
        details: 'E-mail enviado com sucesso via SMTP.'
      }
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Registrar falha no log
    try {
      await prisma.emailLog.create({
        data: {
          from: config.fromEmail || config.user,
          to,
          subject,
          type: 'NOTIFICAÇÃO',
          status: 'REJEITADO',
          details: `Falha no envio SMTP: ${error.message}`
        }
      });
    } catch (logError) {
      console.error('Erro ao gravar log de falha de e-mail:', logError);
    }

    return { success: false, error: error.message };
  }
}

export async function sendTicketEmail(ticket: any, type: 'NEW' | 'REOPENED' | 'RESOLVED') {
  const subjects = {
    NEW: `[Novo Chamado #${ticket.protocol}] - ${ticket.title}`,
    REOPENED: `[Chamado Reaberto #${ticket.protocol}] - ${ticket.title}`,
    RESOLVED: `[Chamado Resolvido #${ticket.protocol}] - ${ticket.title}`,
  };

  const titles = {
    NEW: 'Abertura de Chamado',
    REOPENED: 'Chamado Reaberto',
    RESOLVED: 'Chamado Resolvido',
  };

  const colors = {
    NEW: '#2563eb',
    REOPENED: '#d97706',
    RESOLVED: '#059669',
  };

  const requester = ticket.requester || { name: 'Usuário', email: ticket.requesterEmail || '' };
  if (!requester.email) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ticketLink = `${appUrl}/tickets/${ticket.id}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${colors[type]}; border-bottom: 2px solid ${colors[type]}; padding-bottom: 10px;">${titles[type]}</h2>
      <p>Olá, <strong>${requester.name}</strong>!</p>
      <p>O chamado <strong>#${ticket.protocol}</strong> foi ${type === 'NEW' ? 'criado' : type === 'REOPENED' ? 'reaberto' : 'resolvido'} com sucesso.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Assunto:</strong> ${ticket.title}</p>
        <p style="margin: 5px 0;"><strong>Prioridade:</strong> ${ticket.priority}</p>
        <p style="margin: 5px 0;"><strong>Status Atual:</strong> ${ticket.status}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${ticketLink}" style="background-color: ${colors[type]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visualizar Chamado</a>
      </div>

      <p style="font-size: 0.875rem; color: #64748b;">Este é um e-mail automático, por favor não responda.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 0.75rem; color: #94a3b8;">Upp HelpDesk - Sistema de Suporte</p>
    </div>
  `;

  const result = await sendEmail({
    to: requester.email,
    subject: subjects[type],
    html,
    inReplyTo: ticket.messageId || undefined,
    references: ticket.messageId ? [ticket.messageId] : undefined
  });

  // Somente atualizamos se o ticket ainda não tiver um messageId (ex: criado via portal)
  // Se veio via e-mail, mantemos o ID do e-mail original como chave da thread
  if (result.success && result.messageId && !ticket.messageId) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { messageId: result.messageId }
    });
  }

  return result;
}
