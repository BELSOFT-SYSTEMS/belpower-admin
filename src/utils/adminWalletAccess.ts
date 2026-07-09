import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';

export function canViewWalletMoneyStats(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('wallet.total_balance');
}

export function canViewProviderWalletBalance(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.role === 'finance';
}

export function canViewWalletPage(admin: AdminProfile | null): boolean {
  if (getAdminDemoMode()) return true;
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('transactions.list');
}
