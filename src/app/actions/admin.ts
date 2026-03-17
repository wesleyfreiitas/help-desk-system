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
      website: website || null,
      active: formData.get('active') === 'on'
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

  // Verificar se o e-mail já existe (incluindo deletados para evitar conflito de chave única)
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    if (existingUser.deletedAt) {
      throw new Error('Este e-mail pertence a um usuário que foi excluído. Por favor, utilize outro e-mail ou restaure o usuário anterior.');
    }
    throw new Error('Este e-mail já está em uso por outro usuário.');
  }

  // Verificar se o telefone já existe
  if (phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone: phone.trim() }
    });
    if (existingPhone) {
      throw new Error('Este telefone já está em uso por outro usuário.');
    }
  }

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

export async function updateClient(clientId: string, data: { name: string, document: string, email?: string | null, phone?: string | null, website?: string | null, active?: boolean }) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      document: data.document,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      active: data.active !== undefined ? data.active : undefined
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

  // Verificar se o e-mail já está em uso por outro usuário
  const existingUser = await prisma.user.findFirst({
    where: { 
      email: data.email,
      id: { not: userId }
    }
  });

  if (existingUser) {
    throw new Error('Este e-mail já está em uso por outro usuário.');
  }

  // Verificar se o telefone já está em uso por outro usuário
  if (data.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: data.phone.trim(),
        id: { not: userId }
      }
    });
    if (existingPhone) {
      throw new Error('Este telefone já está em uso por outro usuário.');
    }
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
