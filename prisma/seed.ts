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
