'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const document = formData.get('document') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const website = formData.get('website') as string;

  const client = await prisma.client.create({
    data: {
      name,
      document,
      email: email || null,
      phone: phone || null,
      website: website || null
    }
  });

  // Handle custom fields if any
  const customFieldData: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.startsWith('cf_')) {
      customFieldData[key.replace('cf_', '')] = value as string;
    }
  });

  if (Object.keys(customFieldData).length > 0) {
    await prisma.$transaction(
      Object.entries(customFieldData).map(([fieldId, value]) => 
        prisma.customFieldValue.create({
          data: {
            id: `cf_${client.id}_${fieldId}`,
            clientId: client.id,
            fieldId,
            value
          }
        })
      )
    );
  }

  revalidatePath('/companies');
  redirect('/companies');
}

export async function createProduct(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  if (!name || !name.trim()) throw new Error('Nome do produto é obrigatório');

  await prisma.product.create({
    data: { name: name.trim() }
  });

  revalidatePath('/products');
  redirect('/products');
}

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ATTENDANT')) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const rawPassword = formData.get('password') as string;
  const role = formData.get('role') as string;
  const clientId = formData.get('clientId') as string;
  const phone = formData.get('phone') as string;

  // Usa bcrypt como no auth
  const bcrypt = require('bcryptjs');
  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password,
      role,
      phone: phone || null,
      clientId: clientId ? clientId : null
    }
  });

  revalidatePath('/users');
  redirect('/users');
}

export async function getUserDetails(userId: string) {
  const session = await getSession();
  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(session?.user?.role || '');
  if (!session || isOrgUser) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      client: {
        include: {
          customFields: {
            include: { field: true }
          },
          tickets: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
              assignee: true,
            }
          }
        }
      },
      tickets: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
        }
      }
    }
  });

  return user;
}

export async function getClientDetails(clientId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      users: { where: { deletedAt: null } },
      customFields: {
        include: { field: true }
      },
      tickets: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: true,
        }
      }
    }
  });

  return client;
}

export async function createCategory(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  if (!name || !name.trim()) throw new Error('Nome da categoria é obrigatório');

  await prisma.category.create({ data: { name: name.trim() } });
  revalidatePath('/categories');
}

export async function deleteCategory(categoryId: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.category.update({
    where: { id: categoryId },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/categories');
}

export async function bulkDeleteUsers(userIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  // We should prevent the admin from deleting their own user account
  if (userIds.includes(session.user.id)) {
    throw new Error('Você não pode excluir seu próprio usuário');
  }

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/users');
}

export async function bulkDeleteProducts(productIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/products');
}

export async function bulkDeleteCategories(categoryIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.category.updateMany({
    where: { id: { in: categoryIds } },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/categories');
}

export async function bulkDeleteClients(clientIds: string[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.client.updateMany({
    where: { id: { in: clientIds } },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/companies');
}

export async function updateCategory(categoryId: string, name: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await prisma.category.update({
    where: { id: categoryId },
    data: { name }
  });
}

export async function updateProduct(productId: string, data: { name: string }) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');
  
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name
    }
  });
}

export async function updateClient(clientId: string, data: { name: string, document: string, email?: string | null, phone?: string | null, website?: string | null }) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      document: data.document,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null
    }
  });

  revalidatePath('/companies/' + clientId);
  revalidatePath('/companies');
}

export async function updateUser(userId: string, data: { name: string, email: string, role: string, phone?: string | null, clientId?: string | null }) {
  const session = await getSession();
  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(session?.user?.role || '');
  if (!session || isOrgUser) throw new Error('Unauthorized');
  
  if (session.user.role === 'ATTENDANT' && data.role === 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone || null,
      clientId: data.clientId || null
    }
  });

  revalidatePath('/users/' + userId);
  revalidatePath('/users');
}

export async function bulkImportClients(clients: any[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[]
  };

  // Nomes dos campos personalizados extras na planilha
  const extraFields = ['Firewall', 'IP - Upphone', 'Integrações', 'Notas de Implantação'];
  const fieldMapping: Record<string, string> = {};

  // Garantir que os campos personalizados existem
  for (const fieldName of extraFields) {
    let field = await prisma.customField.findFirst({
      where: { name: fieldName }
    });

    if (!field) {
      field = await prisma.customField.create({
        data: {
          name: fieldName,
          type: 'TEXT'
        }
      });
    }
    fieldMapping[fieldName] = field.id;
  }

  for (const clientData of clients) {
    try {
      if (!clientData.name || !clientData.document) {
        results.errors.push(`Cliente ignorado: Nome ou Documento ausente.`);
        continue;
      }

      const existing = await prisma.client.findFirst({
        where: { document: clientData.document }
      });

      let client;
      if (existing) {
        client = await prisma.client.update({
          where: { id: existing.id },
          data: {
            name: clientData.name,
            email: clientData.email || existing.email,
            deletedAt: null 
          }
        });
        results.updated++;
      } else {
        client = await prisma.client.create({
          data: {
            name: clientData.name,
            document: clientData.document,
            email: clientData.email || null
          }
        });
        results.created++;
      }

      // Processar campos personalizados extras (D, E, F, G da planilha)
      for (const fieldName of extraFields) {
        const val = clientData.extras?.[fieldName];
        if (val) {
          const fieldId = fieldMapping[fieldName];
          const customId = `cf_${client.id}_${fieldId}`;
          
          await prisma.customFieldValue.upsert({
            where: { id: customId },
            update: { value: val.toString() },
            create: {
              id: customId,
              clientId: client.id,
              fieldId: fieldId,
              value: val.toString()
            }
          });
        }
      }
    } catch (err: any) {
      results.errors.push(`Erro ao processar ${clientData.name}: ${err.message}`);
    }
  }

  revalidatePath('/companies');
  return results;
}

export async function bulkImportUsers(users: any[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const bcrypt = require('bcryptjs');
  const defaultPassword = await bcrypt.hash('mudar123', 10);

  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[]
  };

  for (const userData of users) {
    try {
      if (!userData.email || !userData.name) {
        results.errors.push(`Usuário ignorado: Nome ou Email ausente.`);
        continue;
      }

      // Tentar encontrar a empresa pelo CNPJ (Identificador Interno)
      let clientId = null;
      if (userData.companyDocument) {
        const client = await prisma.client.findUnique({
          where: { document: userData.companyDocument }
        });
        if (client) {
          clientId = client.id;
        } else {
          // Fallback: tentar por nome se o CNPJ não bater
          const clientByName = await prisma.client.findFirst({
            where: { name: userData.companyName }
          });
          if (clientByName) clientId = clientByName.id;
        }
      }

      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: userData.name,
            phone: userData.phone || existing.phone,
            clientId: clientId || existing.clientId,
            deletedAt: null
          }
        });
        results.updated++;
      } else {
        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: defaultPassword,
            role: 'CLIENT',
            phone: userData.phone || null,
            clientId: clientId
          }
        });
        results.created++;
      }
    } catch (err: any) {
      results.errors.push(`Erro ao processar ${userData.name}: ${err.message}`);
    }
  }

  revalidatePath('/users');
  return results;
}

export async function bulkImportTickets(ticketsData: any[]) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const results = {
    created: 0,
    errors: [] as string[]
  };

  // Helper para converter string de data PT-BR para Date object
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr.toLowerCase() === 'n/a') return null;
    try {
      // Formato esperado: DD/MM/YYYY HH:MM:SS
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch {
      return null;
    }
  };

  for (const t of ticketsData) {
    try {
      if (!t.title) continue;

      // 1. Vincular Empresa (Client) - Usando Preferencialmente o CNPJ se houver
      let client = null;
      if (t.companyDocument) {
        client = await prisma.client.findFirst({
          where: { document: t.companyDocument }
        });
      }

      if (!client && t.companyName) {
        client = await prisma.client.findFirst({
          where: { name: { contains: t.companyName, mode: 'insensitive' } }
        });
      }

      if (!client) {
        // Se a empresa não existir, vamos criar para não perder o chamado histórico
        client = await prisma.client.create({
          data: {
            name: t.companyName || 'Empresa Desconhecida',
            document: t.companyDocument || null,
          }
        });
      }

      // 2. Vincular Produto
      let product = null;
      if (t.productName) {
        product = await prisma.product.findFirst({
          where: { name: { contains: t.productName, mode: 'insensitive' } }
        });
        if (!product) {
          product = await prisma.product.create({ data: { name: t.productName } });
        }
      }

      // 3. Vincular Categoria
      let category = null;
      if (t.categoryName) {
        category = await prisma.category.findFirst({
          where: { name: { contains: t.categoryName, mode: 'insensitive' } }
        });
        if (!category) {
          category = await prisma.category.create({ data: { name: t.categoryName } });
        }
      }

      // 4. Vincular Atendente (User)
      let assignee = null;
      if (t.assigneeName) {
        assignee = await prisma.user.findFirst({
          where: { name: { contains: t.assigneeName, mode: 'insensitive' } }
        });
      }

      // 5. Vincular Requester (User do Cliente)
      let requester = null;
      if (t.requesterEmail) {
        requester = await prisma.user.findUnique({
          where: { email: t.requesterEmail }
        });
      }
      
      if (!requester && t.requesterName) {
        requester = await prisma.user.findFirst({
          where: { 
            name: { contains: t.requesterName, mode: 'insensitive' },
            clientId: client.id
          }
        });
      }

      // Cria um usuário caso não tenha encontrado Email nem Nome na base
      if (!requester && t.requesterEmail && t.requesterName) {
        const bcrypt = require('bcryptjs');
        const defaultPassword = await bcrypt.hash('mudar123', 10);
        requester = await prisma.user.create({
          data: {
            name: t.requesterName,
            email: t.requesterEmail,
            password: defaultPassword,
            role: 'CLIENT',
            clientId: client.id
          }
        });
      }

      // Mapeamento de Status (Coluna 'Fechado')
      const statusMap: Record<string, string> = {
        'Sim': 'RESOLVIDO',
        'Não': 'ABERTO'
      };
      
      // Mapeamento de Prioridade
      const priorityMap: Record<string, string> = {
        'Baixa': 'BAIXA',
        'Normal': 'MEDIA',
        'Alta': 'ALTA',
        'Urgente': 'ALTA'
      };

      // Gerar protocolo único
      const protocol = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await prisma.ticket.create({
        data: {
          protocol,
          title: t.title,
          description: t.description || 'Importado via planilha',
          status: statusMap[t.closed] || 'ABERTO', // Mapeado da coluna 'Fechado'
          priority: priorityMap[t.priority] || 'BAIXA',
          clientId: client.id,
          productId: product?.id,
          categoryId: category?.id,
          assigneeId: assignee?.id,
          requesterId: requester?.id,
          createdAt: parseDate(t.createdAt) || new Date(),
          resolvedAt: parseDate(t.resolvedAt),
          firstResponseAt: parseDate(t.firstResponseAt),
          slaResolveDate: parseDate(t.deadline),
          reopenedCount: t.reopened === 'Sim' ? 1 : 0,
        }
      });

      results.created++;
    } catch (err: any) {
      results.errors.push(`Erro crítico no chamado "${t.title}": ${err.message}`);
    }
  }

  revalidatePath('/tickets');
  revalidatePath('/dashboard');
  return results;
}

export async function updateCustomFieldValues(clientId: string, values: Record<string, string>) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  // Using a transaction to avoid partial updates
  // We first delete existing values for these fields and then create new ones
  // This avoids dependency on specific unique index naming in the Prisma Client
  await prisma.$transaction(async (tx) => {
    for (const [fieldId, value] of Object.entries(values)) {
      // Delete if exists
      await tx.customFieldValue.deleteMany({
        where: {
          clientId,
          fieldId
        }
      });
      
      // Create new one if value is not empty
      if (value) {
        await tx.customFieldValue.create({
          data: {
            clientId,
            fieldId,
            value
          }
        });
      }
    }
  });

  revalidatePath('/companies/' + clientId);
}
