'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getTicketOptions(type?: string) {
  return await prisma.ticketOption.findMany({
    where: type ? { type } : {},
    orderBy: { order: 'asc' },
  });
}

export async function upsertTicketOption(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const id = formData.get('id') as string | null;
  const type = formData.get('type') as string;
  const label = formData.get('label') as string;
  const value = formData.get('value') as string;
  const color = formData.get('color') as string | null;
  const order = parseInt(formData.get('order') as string || '0');

  if (id) {
    await prisma.ticketOption.update({
      where: { id },
      data: { type, label, value, color, order }
    });
  } else {
    await prisma.ticketOption.create({
      data: { type, label, value, color, order }
    });
  }

  revalidatePath('/settings/options');
}

export async function deleteTicketOption(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.ticketOption.delete({
    where: { id }
  });

  revalidatePath('/settings/options');
}
