import { getPermissions, RolePermissions } from '@/app/actions/permissions';

export async function hasPermission(
  userRole: string,
  resource: string,
  action: 'view' | 'create' | 'edit' | 'delete' | string
): Promise<boolean> {
  // Admin sempre tem todas as permissões
  if (userRole === 'ADMIN') return true;

  const permissions = await getPermissions();
  const roleRules = permissions[userRole];

  if (!roleRules || !roleRules[resource]) {
    return false;
  }

  return !!roleRules[resource][action];
}

/**
 * Versão síncrona para ser usada quando as permissões já foram carregadas
 */
export function checkPermission(
  permissions: RolePermissions,
  userRole: string,
  resource: string,
  action: 'view' | 'create' | 'edit' | 'delete' | string
): boolean {
  if (userRole === 'ADMIN') return true;
  
  const roleRules = permissions[userRole];
  if (!roleRules || !roleRules[resource]) return false;
  
  return !!roleRules[resource][action];
}
