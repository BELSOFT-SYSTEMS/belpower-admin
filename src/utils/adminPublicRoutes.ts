import { PUBLIC_ADMIN_PATHS } from '@/constants/adminNavPermissions';

export function isPublicAdminRoute(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some((path) => pathname === path);
}
