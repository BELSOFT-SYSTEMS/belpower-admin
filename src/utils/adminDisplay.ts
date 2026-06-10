import type { AdminProfile } from '@/types/adminAuth';
import { getInitialsFromDisplayName, getUserInitials } from '@/utils/userAvatar';

export function getAdminDisplayName(admin: AdminProfile | null): string {
  if (!admin) return 'Admin';

  const name = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim();
  if (name) return name;

  const emailLocal = admin.email.split('@')[0]?.trim();
  return emailLocal || 'Admin';
}

export function getAdminInitials(admin: AdminProfile | null): string {
  if (!admin) return '?';

  if (admin.firstName || admin.lastName) {
    return getUserInitials(admin.firstName ?? '', admin.lastName ?? '');
  }

  const emailLocal = admin.email.split('@')[0] ?? '';
  return emailLocal ? getInitialsFromDisplayName(emailLocal) : '?';
}
