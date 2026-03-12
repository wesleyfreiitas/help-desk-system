'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSlaPolicies() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  return await prisma.slaPolicy.findMany({
    orderBy: { priority: 'asc' }
  });
}

export async function updateSlaPolicies(policies: { priority: string, responseTime: number, resolutionTime: number }[]) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.$transaction(
    policies.map(policy => 
      prisma.slaPolicy.upsert({
        where: { priority: policy.priority },
        create: {
          priority: policy.priority,
          responseTime: policy.responseTime,
          resolutionTime: policy.resolutionTime
        },
        update: {
          responseTime: policy.responseTime,
          resolutionTime: policy.resolutionTime
        }
      })
    )
  );

  revalidatePath('/settings/sla');
}
