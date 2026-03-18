import { prisma } from './prisma';
import { getSession } from './auth';
import { headers } from 'next/headers';

export async function recordAuditLog({ 
  action, 
  resource, 
  resourceId, 
  details 
}: { 
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
  resource: string,
  resourceId?: string,
  details?: any
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return;

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : realIp || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ip: ip
      }
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
