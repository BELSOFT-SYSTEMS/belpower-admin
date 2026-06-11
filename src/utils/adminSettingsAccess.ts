import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';

/** Maintenance toggles — requires system.maintenance (e.g. admin, not support). */
export function canManageMaintenance(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('system.maintenance');
}
