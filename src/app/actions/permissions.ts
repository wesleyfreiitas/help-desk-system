'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type RolePermissions = {
  [role: string]: {
    [resource: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      [action: string]: boolean;
    };
  };
};

const DEFAULT_PERMISSIONS: RolePermissions = {
  ATTENDANT: {
    users: { view: true, create: true, edit: false, delete: false },
    tickets: { view: true, create: true, edit: true, delete: false },
    companies: { view: true, create: true, edit: true, delete: false },
    products: { view: false, create: false, edit: false, delete: false },
    categories: { view: false, create: false, edit: false, delete: false },
  },
  ORG_MANAGER: {
    users: { view: true, create: true, edit: true, delete: false },
    tickets: { view: true, create: true, edit: true, delete: false },
  },
  ORG_MEMBER: {
    users: { view: true, create: false, edit: false, delete: false },
    tickets: { view: true, create: true, edit: false, delete: false },
  }
};

export async function getPermissions(): Promise<RolePermissions> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'role_permissions' }
  });

  if (!setting) {
    return DEFAULT_PERMISSIONS;
  }

  return JSON.parse(setting.value);
}

export async function updatePermissions(permissions: RolePermissions) {
  await prisma.systemSetting.upsert({
    where: { key: 'role_permissions' },
    update: { value: JSON.stringify(permissions) },
    create: { key: 'role_permissions', value: JSON.stringify(permissions) }
  });

  revalidatePath('/(dashboard)/settings/permissions');
  revalidatePath('/(dashboard)/layout'); // Force sidebar revalidation
  return { success: true };
}
