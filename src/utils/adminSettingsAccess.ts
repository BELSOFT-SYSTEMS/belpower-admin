import type { AdminProfile } from '@/types/adminAuth';

/** Maintenance toggles: super_admin and admin only. */
export function canManageMaintenance(admin: AdminProfile | null): boolean {
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.role === 'super_admin' || admin.role === 'admin';
}
