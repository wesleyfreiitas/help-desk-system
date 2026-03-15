import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Por favor, forneça o caminho do arquivo Excel.');
    console.log('Uso: npx tsx scripts/import-comments.ts <caminho_do_arquivo>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`Lendo arquivo: ${absolutePath}`);

  // Check file magic numbers
  const fs = require('fs');
  const buffer = fs.readFileSync(absolutePath);
  console.log(`Tamanho do arquivo: ${buffer.length} bytes`);
  console.log(`Primeiros bytes (hex): ${buffer.slice(0, 8).toString('hex')}`);

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log(`Planilhas encontradas: ${workbook.SheetNames.join(', ')}`);
  console.log(`Usando a planilha: ${sheetName}`);
  console.log(`Keys do objeto worksheet: ${Object.keys(worksheet).filter(k => k[0] === '!').join(', ')}`);
  console.log(`Range (!ref): ${worksheet['!ref']}`);
  
  const cellKeys = Object.keys(worksheet).filter(k => k[0] !== '!');
  console.log(`Total de células com dados: ${cellKeys.length}`);
  if (cellKeys.length > 0) {
    console.log(`Exemplo de células: ${cellKeys.slice(0, 10).join(', ')}`);
  }
  
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  console.log(`Linhas totais detectadas: ${data.length}`);

  const firstPopulatedRow = data.find(r => r && r.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));
  console.log(`Primeira linha populada encontrada: ${JSON.stringify(firstPopulatedRow)}`);

  let currentClientId: string | null = null;
  let currentTicketId: string | null = null;
  let successCount = { tickets: 0, interactions: 0 };
  let errorCount = 0;

  const userCache: Record<string, string> = {};
  const clientCache: Record<string, string> = {};
  const categoryCache: Record<string, string> = {};

  // Fallback Admin
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Debug: logar linhas que tenham QUALQUER coisa
    if (row && row.length > 0 && row.some(c => c !== "")) {
       console.log(`Debug Linha ${i}: ${JSON.stringify(row)}`);
    }

    if (!row || row.length === 0) continue;

    const cellA = row[0]?.toString().trim();
    const cellG = row[6]?.toString().trim();
    const cellH = row[7]?.toString().trim();

    // 1. Detectar Organização (Headers de Cliente)
    if (cellG === 'Organização:' && cellH) {
      const clientName = cellH;
      if (!clientCache[clientName]) {
        let client = await prisma.client.findFirst({ where: { name: clientName } });
        if (!client) {
          client = await prisma.client.create({ 
            data: { name: clientName, document: Math.random().toString().substring(2, 14) } 
          });
        }
        clientCache[clientName] = client.id;
      }
      currentClientId = clientCache[clientName];
      console.log(`\n[ORGANIZAÇÃO] ${clientName}`);
      continue;
    }

    // 2. Identificar novo Chamado (# na Col A)
    if (cellA && cellA.startsWith('#')) {
      const protocol = cellA.replace('#', '');
      const title = row[1]?.toString().trim() || 'Sem Assunto'; // Col B
      const categoryName = row[3]?.toString().trim();          // Col D
      const statusRaw = row[4]?.toString().trim();             // Col E
      const createdAt = parseExcelDate(row[5]);                // Col F
      const finishedAt = parseExcelDate(row[6]);               // Col G
      const firstResponse = parseExcelDate(row[7]);            // Col H
      const deadline = parseExcelDate(row[8]);                 // Col I
      const priorityRaw = row[9]?.toString().trim();           // Col J

      let categoryId: string | undefined = undefined;
      if (categoryName) {
        if (!categoryCache[categoryName]) {
          let cat = await prisma.category.findFirst({ where: { name: categoryName } });
          if (!cat) cat = await prisma.category.create({ data: { name: categoryName } });
          categoryCache[categoryName] = cat.id;
        }
        categoryId = categoryCache[categoryName];
      }

      const status = normalizeStatus(statusRaw);
      const priority = normalizePriority(priorityRaw);

      if (!currentClientId) {
        const firstClient = await prisma.client.findFirst();
        currentClientId = firstClient?.id || (await prisma.client.create({ data: { name: 'Geral', document: '000' } })).id;
      }

      try {
        const ticket = await prisma.ticket.upsert({
          where: { protocol },
          update: {
            title,
            status,
            priority,
            categoryId,
            clientId: currentClientId,
            createdAt: createdAt || undefined,
            resolvedAt: finishedAt,
            firstResponseAt: firstResponse,
            slaResolveDate: deadline,
            updatedAt: new Date(),
          },
          create: {
            protocol,
            title,
            description: 'Importado via Estrutura Hierárquica Final',
            status,
            priority,
            categoryId,
            clientId: currentClientId,
            createdAt: createdAt || new Date(),
            resolvedAt: finishedAt,
            firstResponseAt: firstResponse,
            slaResolveDate: deadline,
          },
        });
        currentTicketId = ticket.id;
        successCount.tickets++;
        console.log(`  [CHAMADO] ${protocol} - ${title}`);
      } catch (err: any) {
        console.error(`  [ERRO TICKET] ${protocol}: ${err.message}`);
        currentTicketId = null;
        errorCount++;
      }
      continue;
    }

    // 3. Identificar Mensagem (Data na Col A, Mensagem na Col B)
    if (currentTicketId && cellA && cellA.includes('/') && row[1]) {
      if (cellA.toLowerCase() === 'data' || row[1].toString().toLowerCase() === 'mensagem') continue;

      const messageText = row[1].toString().trim();
      const attendantName = row[6]?.toString().trim(); // Col G costuma ter o atendente na msg

      let userId = admin?.id || '';
      if (attendantName && attendantName.length > 3) {
        if (!userCache[attendantName]) {
          let user = await prisma.user.findFirst({ where: { name: { contains: attendantName, mode: 'insensitive' } } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: attendantName,
                email: attendantName.toLowerCase().replace(/\s+/g, '.') + '@import.com',
                password: 'imported_user',
                role: 'ATTENDANT'
              }
            });
          }
          userCache[attendantName] = user.id;
        }
        userId = userCache[attendantName];
      }

      try {
        // Verificar duplicata exata no ticket
        const existing = await prisma.interaction.findFirst({
           where: {
              ticketId: currentTicketId,
              message: messageText,
              createdAt: parseExcelDate(cellA) || undefined
           }
        });

        if (!existing) {
           await prisma.interaction.create({
             data: {
               ticketId: currentTicketId,
               userId: userId,
               message: messageText,
               createdAt: parseExcelDate(cellA) || new Date(),
             },
           });
           successCount.interactions++;
           console.log(`    [MSG] ${attendantName || 'Admin'}: ${messageText.substring(0, 40)}...`);
        }
      } catch (err: any) {
        console.error(`    [ERRO MSG] ${err.message}`);
        errorCount++;
      }
    }
  }

  console.log(`\nImportação Finalizada!`);
  console.log(`Chamados: ${successCount.tickets}`);
  console.log(`Mensagens: ${successCount.interactions}`);
  console.log(`Erros: ${errorCount}`);
}

function normalizeStatus(raw?: string): any {
  if (!raw) return 'ABERTO';
  const r = raw.toUpperCase();
  if (r.includes('FINALIZADO') || r.includes('FECHADO')) return 'FECHADO';
  if (r.includes('RESOLVIDO')) return 'RESOLVIDO';
  if (r.includes('ANDAMENTO')) return 'EM_ANDAMENTO';
  if (r.includes('PENDENTE')) return 'PENDENTE';
  if (r.includes('CLIENTE')) return 'AGUARDANDO_CLIENTE';
  if (r.includes('TERCEIRO')) return 'AGUARDANDO_TERCEIRO';
  if (r.includes('CANCELADO')) return 'CANCELADO';
  return 'ABERTO';
}

function normalizePriority(raw?: string): any {
  if (!raw) return 'MEDIA';
  const r = raw.toUpperCase();
  if (r.includes('ALTA') || r.includes('URGENTE')) return 'ALTA';
  if (r.includes('BAIXA')) return 'BAIXA';
  if (r.includes('NORMAL')) return 'MEDIA';
  return 'MEDIA';
}

function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = val.toString().trim();
  if (!str || str === 'Atendente' || str === 'Deadline' || str === 'Data de Criação') return null;

  const parts = str.split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const year = parseInt(dateParts[2]);
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      return new Date(year, month, day, parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2]) || 0);
    }
    return new Date(year, month, day);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
