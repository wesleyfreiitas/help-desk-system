'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';

export async function getCustomFields() {
  const session = await getSession();
  const isClient = session?.user?.role === 'CLIENT';
  if (!session || isClient) throw new Error('Unauthorized');

  return await prisma.customField.findMany({
    orderBy: { createdAt: 'asc' }
  });
}

export async function createCustomField(data: { name: string, type: string, target: string, options?: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const field = await prisma.customField.create({
    data: {
      name: data.name,
      type: data.type,
      target: data.target,
      options: data.options || null
    }
  });

  await recordAuditLog({
    action: 'CREATE',
    resource: 'CUSTOM_FIELD',
    resourceId: field.id,
    details: { name: data.name, target: data.target }
  });

  revalidatePath('/settings/custom-fields');
  return field;
}

export async function updateCustomField(id: string, data: { name: string, type: string, target: string, options?: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const field = await prisma.customField.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      target: data.target,
      options: data.options || null
    }
  });

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'CUSTOM_FIELD',
    resourceId: field.id,
    details: { name: data.name }
  });

  revalidatePath('/settings/custom-fields');
  return field;
}

export async function deleteCustomField(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  // Also delete values
  await prisma.customFieldValue.deleteMany({ where: { fieldId: id } });
  await prisma.customField.delete({ where: { id } });

  await recordAuditLog({
    action: 'DELETE',
    resource: 'CUSTOM_FIELD',
    resourceId: id
  });

  revalidatePath('/settings/custom-fields');
}
