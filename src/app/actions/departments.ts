'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function getDepartments() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          members: true,
          tickets: { where: { deletedAt: null } }
        }
      }
    }
  });
}

export async function getDepartmentDetails(departmentId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  return prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      },
      tickets: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { assignee: true, requester: true }
      }
    }
  });
}

export async function getMyDepartments() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return prisma.departmentMember.findMany({
    where: { userId: session.user.id },
    include: { department: true }
  });
}

// ─── CREATE / UPDATE / DELETE ─────────────────────────────────────────────────

export async function createDepartment(data: { name: string; description?: string; color?: string }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const department = await prisma.department.create({
    data: {
      name: data.name.trim().toUpperCase(),
      description: data.description?.trim() || null,
      color: data.color || '#6366f1'
    }
  });

  await recordAuditLog({
    action: 'CREATE',
    resource: 'DEPARTMENT',
    resourceId: department.id,
    details: { name: department.name }
  });

  revalidatePath('/departments');
  return department;
}

export async function updateDepartment(departmentId: string, data: { name: string; description?: string; color?: string; active?: boolean }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: {
      name: data.name.trim().toUpperCase(),
      description: data.description?.trim() || null,
      color: data.color,
      active: data.active
    }
  });

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'DEPARTMENT',
    resourceId: departmentId,
    details: { name: department.name }
  });

  revalidatePath('/departments');
  revalidatePath('/departments/' + departmentId);
  return department;
}

export async function deleteDepartment(departmentId: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  // Block if there are active tickets
  const activeTickets = await prisma.ticket.count({
    where: { departmentId, deletedAt: null, status: { notIn: ['FECHADO', 'CANCELADO'] } }
  });
  if (activeTickets > 0) {
    throw new Error(`Não é possível excluir: o departamento ainda possui ${activeTickets} chamado(s) ativo(s).`);
  }

  await prisma.department.delete({ where: { id: departmentId } });

  await recordAuditLog({
    action: 'DELETE',
    resource: 'DEPARTMENT',
    resourceId: departmentId
  });

  revalidatePath('/departments');
}

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export async function addDepartmentMember(departmentId: string, userId: string, isLeader: boolean = false) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.departmentMember.upsert({
    where: { departmentId_userId: { departmentId, userId } },
    update: { isLeader },
    create: { departmentId, userId, isLeader }
  });

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'DEPARTMENT_MEMBER',
    resourceId: departmentId,
    details: { userId, isLeader }
  });

  revalidatePath('/departments/' + departmentId);
}

export async function removeDepartmentMember(departmentId: string, userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.departmentMember.delete({
    where: { departmentId_userId: { departmentId, userId } }
  });

  await recordAuditLog({
    action: 'DELETE',
    resource: 'DEPARTMENT_MEMBER',
    resourceId: departmentId,
    details: { userId }
  });

  revalidatePath('/departments/' + departmentId);
}

// ─── TICKET TRANSFER ─────────────────────────────────────────────────────────

export async function transferTicketToDepartment(ticketId: string, newDepartmentId: string | null) {
  const session = await getSession();
  if (!session || session.user.role === 'CLIENT') throw new Error('Unauthorized');

  const before = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { departmentId: true, protocol: true } });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      departmentId: newDepartmentId,
      assigneeId: null // Reset assignee on transfer
    }
  });

  await recordAuditLog({
    action: 'UPDATE',
    resource: 'TICKET_TRANSFER',
    resourceId: ticketId,
    details: { from: before?.departmentId, to: newDepartmentId, protocol: before?.protocol }
  });

  revalidatePath('/tickets/' + ticketId);
  revalidatePath('/tickets');
}
