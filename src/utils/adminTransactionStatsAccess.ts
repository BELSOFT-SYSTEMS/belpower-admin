import type { AdminProfile } from '@/types/adminAuth';

type MoneyStatsFilters = {
  canViewMoneyStats?: boolean;
} | null | undefined;

export function canViewTransactionMoneyStats(
  admin: AdminProfile | null | undefined,
  filters?: MoneyStatsFilters
): boolean {
  if (filters && typeof filters.canViewMoneyStats === 'boolean') {
    return filters.canViewMoneyStats;
  }

  if (!admin) return false;
  if (admin.allAccess || admin.role === 'super_admin') return true;

  return (
    admin.role === 'finance' || admin.permissions.includes('dashboard.money_stats')
  );
}

export function getTransactionStatCardCount(canViewMoneyStats: boolean): number {
  return canViewMoneyStats ? 10 : 6;
}
