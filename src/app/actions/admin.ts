'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';
import { headers } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

  // Verificar se o e-mail já existe (incluindo deletados para permitir reativação)
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser && !existingUser.deletedAt) {
    throw new Error('Este e-mail já está em uso por outro usuário.');
  }

  // Verificar se o telefone já existe
  if (phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { 
        phone: phone.trim(),
        deletedAt: null // Apenas usuários ativos
      }
    });
    if (existingPhone && existingPhone.id !== existingUser?.id) {
      throw new Error('Este telefone já está em uso por outro usuário ativo.');
    }
  }

  const sendWelcomeEmail = formData.get('sendWelcomeEmail') === 'on';

  // Usa bcrypt como no auth
  let password = rawPassword;
  if (!password && sendWelcomeEmail) {
    // Gerar uma senha aleatória segura se o e-mail de boas-vindas estiver marcado
    password = crypto.randomBytes(16).toString('hex');
  } else if (!password) {
    throw new Error('A senha é obrigatória se o e-mail de boas-vindas não for enviado.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser;
  if (existingUser && existingUser.deletedAt) {
    // Reativar usuário existente
    newUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        password: hashedPassword,
        role,
        phone: phone || null,
        clientId: clientId ? clientId : null,
        updatedAt: new Date(),
        deletedAt: null // Reativar!
      }
    });

    // Limpar campos personalizados antigos para garantir integridade
    await prisma.customFieldValue.deleteMany({
      where: { userId: newUser.id }
    });
  } else {
    // Criar novo usuário
    newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        clientId: clientId ? clientId : null
      }
    });
  }

  // Handle custom fields if any
  const customFieldData: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof key === 'string' && key.startsWith('cf_')) {
      customFieldData[key.replace('cf_', '')] = value as string;
    }
  });

  if (Object.keys(customFieldData).length > 0) {
    await prisma.$transaction(
      Object.entries(customFieldData).map(([fieldId, value]) => 
        prisma.customFieldValue.create({
          data: {
            userId: newUser.id,
            fieldId,
            value
          }
        })
      )
    );
  }

  // Enviar e-mail de boas-vindas se solicitado
  if (sendWelcomeEmail) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000 * 24); // 24 horas para ativação

    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expires },
      create: { email, token, expires }
    });

    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${proto}://${host}`;
    const resetLink = `${baseUrl}/reset?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao Upp HelpDesk - Ative sua conta',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Bem-vindo, ${name}!</h2>
          <p>Sua conta no <strong>Upp HelpDesk</strong> foi criada com sucesso.</p>
          <p>Para começar a usar o sistema, você precisa definir sua senha de acesso clicando no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Definir Minha Senha</a>
          </div>
          <p style="font-size: 0.875rem; color: #64748b;">Este link de ativação é válido por 24 horas.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.75rem; color: #94a3b8;">Upp HelpDesk - Sistema de Suporte</p>
        </div>
      `
    });
  }

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
      customFields: {
        include: { field: true }
      },
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

  await prisma.$transaction(async (tx) => {
    for (const [fieldId, value] of Object.entries(values)) {
      await tx.customFieldValue.deleteMany({
        where: { clientId, fieldId }
      });
      
      if (value) {
        await tx.customFieldValue.create({
          data: { clientId, fieldId, value }
        });
      }
    }
  });

  revalidatePath('/companies/' + clientId);
}

export async function updateUserCustomFieldValues(userId: string, values: Record<string, string>) {
  const session = await getSession();
  const isOrgUser = ['CLIENT', 'ORG_MANAGER', 'ORG_MEMBER'].includes(session?.user?.role || '');
  if (!session || isOrgUser) throw new Error('Unauthorized');

  await prisma.$transaction(async (tx) => {
    for (const [fieldId, value] of Object.entries(values)) {
      await tx.customFieldValue.deleteMany({
        where: { userId, fieldId }
      });
      
      if (value) {
        await tx.customFieldValue.create({
          data: { userId, fieldId, value }
        });
      }
    }
  });

  revalidatePath('/users/' + userId);
}
