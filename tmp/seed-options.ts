import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const options = [
    // TYPE
    { type: 'TYPE', label: 'Pergunta', value: 'Pergunta', order: 1 },
    { type: 'TYPE', label: 'Incidente', value: 'Incidente', order: 2 },
    { type: 'TYPE', label: 'Problema', value: 'Problema', order: 3 },
    { type: 'TYPE', label: 'Solicitação de recurso', value: 'Solicitação de recurso', order: 4 },
    { type: 'TYPE', label: 'Reembolso', value: 'Reembolso', order: 5 },

    // SOURCE
    { type: 'SOURCE', label: 'Telefone', value: 'Telefone', order: 1 },
    { type: 'SOURCE', label: 'Email', value: 'Email', order: 2 },
    { type: 'SOURCE', label: 'Portal', value: 'Portal', order: 3 },
    { type: 'SOURCE', label: 'Chat', value: 'Chat', order: 4 },
    { type: 'SOURCE', label: 'Pessoalmente', value: 'Pessoalmente', order: 5 },

    // STATUS
    { type: 'STATUS', label: 'Aberto', value: 'ABERTO', order: 1, color: '#ef4444' },
    { type: 'STATUS', label: 'Em Andamento', value: 'EM_ANDAMENTO', order: 2, color: '#3b82f6' },
    { type: 'STATUS', label: 'Pendente', value: 'PENDENTE', order: 3, color: '#f59e0b' },
    { type: 'STATUS', label: 'Aguardando Cliente', value: 'AGUARDANDO_CLIENTE', order: 4, color: '#8b5cf6' },
    { type: 'STATUS', label: 'Aguardando Terceiro', value: 'AGUARDANDO_TERCEIRO', order: 5, color: '#6366f1' },
    { type: 'STATUS', label: 'Resolvido', value: 'RESOLVIDO', order: 6, color: '#10b981' },
    { type: 'STATUS', label: 'Fechado', value: 'FECHADO', order: 7, color: '#6b7280' },

    // PRIORITY
    { type: 'PRIORITY', label: 'Baixa', value: 'BAIXA', order: 1, color: '#10b981' },
    { type: 'PRIORITY', label: 'Média', value: 'MEDIA', order: 2, color: '#f59e0b' },
    { type: 'PRIORITY', label: 'Alta', value: 'ALTA', order: 3, color: '#ef4444' },
  ];

  // Limpar opções existentes para evitar duplicatas se rodar de novo
  const count = await prisma.ticketOption.count();
  if (count === 0) {
    for (const opt of options) {
      await prisma.ticketOption.create({
        data: opt
      });
    }
    console.log('Opções iniciais criadas com sucesso!');
  } else {
    console.log('A tabela de opções já contém dados, ignorando seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
