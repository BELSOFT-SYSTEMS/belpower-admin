import type { AdminProfile } from '@/types/adminAuth';

export function canViewWalletMoneyStats(admin: AdminProfile | null): boolean {
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('wallet.total_balance');
}

export function canViewWalletPage(admin: AdminProfile | null): boolean {
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes('transactions.list');
}
