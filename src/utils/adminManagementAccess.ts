import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';
import type { AdminAccount, AdminRole } from '@/types/adminManagement';

/** Roles that may open Admin Management at all. */
export const ADMIN_MANAGEMENT_VIEWER_ROLES: AdminRole[] = ['super_admin', 'admin'];

/** Roles an `admin` (not super_admin) may create, edit, suspend, or reset password for. */
export const MANAGEABLE_BY_ADMIN_ROLES: AdminRole[] = ['support', 'content_manager'];

/** Roles offered in the create-admin form (content_manager excluded until module ships). */
export const CREATABLE_ADMIN_ROLES: AdminRole[] = [
  'super_admin',
  'admin',
  'support',
  'finance',
];

export function canAccessAdminManagement(actor: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!actor) return false;
  if (!ADMIN_MANAGEMENT_VIEWER_ROLES.includes(actor.role)) return false;
  return actor.allAccess || actor.permissions.includes('admins.list');
}

export function canCreateAdminAccount(actor: AdminProfile | null): boolean {
  if (!actor) return false;
  if (actor.allAccess || actor.role === 'super_admin') return true;
  if (actor.role === 'admin') {
    return actor.permissions.includes('admins.create');
  }
  return false;
}

export function getCreatableAdminRoles(actor: AdminProfile | null): AdminRole[] {
  if (!actor) return [];
  if (actor.allAccess || actor.role === 'super_admin') {
    return [...CREATABLE_ADMIN_ROLES];
  }
  if (actor.role === 'admin' && canCreateAdminAccount(actor)) {
    return ['support'];
  }
  return [];
}

export function canManageAdminTarget(
  actor: AdminProfile | null,
  target: Pick<AdminAccount, 'id' | 'role'>
): boolean {
  if (!actor) return false;
  if (actor.id === target.id) return true;
  if (actor.allAccess || actor.role === 'super_admin') {
    return target.role !== 'super_admin' || actor.id === target.id;
  }
  if (actor.role === 'admin') {
    return MANAGEABLE_BY_ADMIN_ROLES.includes(target.role);
  }
  return false;
}

export function canEditAdminAccount(
  actor: AdminProfile | null,
  target: AdminAccount
): boolean {
  if (!canManageAdminTarget(actor, target)) return false;
  if (actor?.allAccess || actor?.role === 'super_admin') return true;
  if (actor?.role === 'admin') {
    return (
      actor.permissions.includes('admins.update') &&
      MANAGEABLE_BY_ADMIN_ROLES.includes(target.role)
    );
  }
  return false;
}

export function canSuspendAdminAccount(
  actor: AdminProfile | null,
  target: AdminAccount
): boolean {
  if (!canEditAdminAccount(actor, target)) return false;
  if (target.role === 'super_admin') return false;
  if (actor?.id === target.id) return false;
  return true;
}

export function canDeleteAdminAccount(
  actor: AdminProfile | null,
  target: AdminAccount
): boolean {
  if (!actor) return false;
  if (!(actor.allAccess || actor.role === 'super_admin')) return false;
  if (target.role === 'super_admin') return false;
  if (actor.id === target.id) return false;
  return true;
}

export function canResetAdminPassword(
  actor: AdminProfile | null,
  target: AdminAccount
): boolean {
  if (!canManageAdminTarget(actor, target)) return false;
  if (actor?.allAccess || actor?.role === 'super_admin') return true;
  return actor?.role === 'admin' && MANAGEABLE_BY_ADMIN_ROLES.includes(target.role);
}

export function filterAdminsVisibleToActor(
  actor: AdminProfile | null,
  admins: AdminAccount[]
): AdminAccount[] {
  if (!actor) return [];
  if (actor.allAccess || actor.role === 'super_admin') return admins;
  if (actor.role === 'admin') {
    return admins.filter(
      (a) =>
        MANAGEABLE_BY_ADMIN_ROLES.includes(a.role) ||
        a.role === 'admin' ||
        a.id === actor.id
    );
  }
  return [];
}

export function canViewAdminDetail(
  actor: AdminProfile | null,
  target: AdminAccount
): boolean {
  if (!canAccessAdminManagement(actor)) return false;
  return filterAdminsVisibleToActor(actor, [target]).length > 0;
}

export function getEditableAdminRoles(
  actor: AdminProfile | null,
  target?: AdminAccount
): AdminRole[] {
  if (!actor) return [];
  if (actor.allAccess || actor.role === 'super_admin') {
    if (target && actor.id === target.id) return [];
    if (target?.role === 'super_admin') return [];
    return ['super_admin', 'admin', 'support', 'finance', 'content_manager'];
  }
  if (actor.role === 'admin') {
    if (target && !MANAGEABLE_BY_ADMIN_ROLES.includes(target.role)) return [];
    return [...MANAGEABLE_BY_ADMIN_ROLES];
  }
  return [];
}
