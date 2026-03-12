'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getCannedResponses() {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ATTENDANT')) {
    throw new Error('Unauthorized');
  }

  return await prisma.cannedResponse.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createCannedResponse(data: { title: string, content: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const response = await prisma.cannedResponse.create({
    data: {
      title: data.title,
      content: data.content
    }
  });

  revalidatePath('/settings/canned-responses');
  return response;
}

export async function updateCannedResponse(id: string, data: { title: string, content: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const response = await prisma.cannedResponse.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content
    }
  });

  revalidatePath('/settings/canned-responses');
  return response;
}

export async function deleteCannedResponse(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.cannedResponse.delete({
    where: { id }
  });

  revalidatePath('/settings/canned-responses');
}
