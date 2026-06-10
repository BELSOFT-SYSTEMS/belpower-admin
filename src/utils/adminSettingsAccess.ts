import type { AdminProfile } from '@/types/adminAuth';

/** Maintenance toggles — requires system.maintenance (e.g. admin, not support). */
export function canManageMaintenance(admin: AdminProfile | null): boolean {
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('system.maintenance');
}
