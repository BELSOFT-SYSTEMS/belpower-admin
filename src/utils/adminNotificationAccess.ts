import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';

export function canViewNotificationHistory(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess || admin.role === 'super_admin' || admin.role === 'admin') {
    return true;
  }
  return false;
}

export function canSendNotifications(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('notifications.manage');
}
