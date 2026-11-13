import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';

/** Analytics & Reports: Super Admin and Finance only. */
export function canAccessAnalyticsReports(
  admin: AdminProfile | null | undefined
): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess || admin.role === 'super_admin') return true;
  return admin.role === 'finance';
}
