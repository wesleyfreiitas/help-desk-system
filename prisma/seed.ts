import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.attachment.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.category.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.ticketOption.deleteMany();

  console.log('Dados antigos limpos. Semeando novos dados...');

  // Criar Cliente
  const client1 = await prisma.client.create({
    data: {
      name: 'Empresa ACME',
      document: '12.345.678/0001-99',
      email: 'contato@acme.com',
      phone: '(11) 99999-9999',
    },
  });

  // Criar Usuários
  const bcrypt = require('bcryptjs');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Master',
      email: 'admin@helpdesk.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  const attendant = await prisma.user.create({
    data: {
      name: 'João Atendente',
      email: 'joao@helpdesk.com',
      password: hashedUserPassword,
      role: 'ATTENDANT',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      name: 'Maria Cliente',
      email: 'maria@acme.com',
      password: hashedUserPassword,
      role: 'CLIENT',
      clientId: client1.id,
    },
  });


  // Criar Categoria
  const category1 = await prisma.category.create({
    data: { name: 'Dúvida Técnica' },
  });

  const category2 = await prisma.category.create({
    data: { name: 'Problema Financeiro' },
  });

  // Criar Produto
  const product1 = await prisma.product.create({
    data: {
      name: 'Sistema ERP',
    },
  });

  // Criar Chamado
  const ticket = await prisma.ticket.create({
    data: {
      protocol: 'TKT-1001',
      title: 'Erro ao emitir nota fiscal',
      description: 'Ao tentar emitir a nota, aparece o erro 500.',
      status: 'ABERTO',
      priority: 'ALTA',
      categoryId: category1.id,
      clientId: client1.id,
      productId: product1.id,
      slaResponseDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora de SLA
      slaResolveDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 horas de SLA
    },
  });

  // Criar Interação
  await prisma.interaction.create({
    data: {
      ticketId: ticket.id,
      userId: clientUser.id,
      message: 'Olá, preciso de urgência nisso, o faturamento está parado.',
    },
  });

  // Criar Opções de Ticket (Tipos)
  const ticketTypes = [
    { label: 'Pergunta', value: 'Pergunta', type: 'TYPE', order: 1 },
    { label: 'Incidente', value: 'Incidente', type: 'TYPE', order: 2 },
    { label: 'Problema', value: 'Problema', type: 'TYPE', order: 3 },
    { label: 'Solicitação de recurso', value: 'Solicitação de recurso', type: 'TYPE', order: 4 },
  ];

  for (const tt of ticketTypes) {
    await prisma.ticketOption.create({ data: tt });
  }

  // Criar Opções de Ticket (Status)
  const ticketStatuses = [
    { label: 'Aberto', value: 'ABERTO', type: 'STATUS', order: 1, color: '#e0f2fe' },
    { label: 'Pendente', value: 'PENDENTE', type: 'STATUS', order: 2, color: '#fef3c7' },
    { label: 'Resolvido', value: 'RESOLVIDO', type: 'STATUS', order: 3, color: '#dcfce3' },
    { label: 'Fechado', value: 'FECHADO', type: 'STATUS', order: 4, color: '#f1f5f9' },
    { label: 'Aguardando cliente', value: 'AGUARDANDO_CLIENTE', type: 'STATUS', order: 5, color: '#fce7f3' },
    { label: 'Aguardando terceiros', value: 'AGUARDANDO_TERCEIRO', type: 'STATUS', order: 6, color: '#f1f5f9' },
  ];

  for (const ts of ticketStatuses) {
    await prisma.ticketOption.create({ data: ts });
  }

  console.log('Seed completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
