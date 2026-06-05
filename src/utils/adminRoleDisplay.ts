import type { AdminRole } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';

export function getRolePillClass(role: AdminRole): string {
  return `pill pill_role_${role}`;
}

export function formatAdminRole(role: AdminRole): string {
  return ADMIN_ROLE_LABELS[role];
}
