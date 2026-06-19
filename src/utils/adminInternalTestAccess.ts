import type { AdminProfile } from '@/types/adminAuth';

type InternalTestVisibilityFilters = {
  canViewInternalTestTransactions?: boolean;
  canViewInternalTestUsers?: boolean;
  excludeInternalTest?: boolean;
} | null | undefined;

export function isSuperAdminActor(admin: AdminProfile | null | undefined): boolean {
  return Boolean(admin?.allAccess || admin?.role === 'super_admin');
}

/** Prefer API filters; fall back to super-admin role when the API omits the flag. */
export function resolveCanViewInternalTest(
  filters: InternalTestVisibilityFilters,
  admin: AdminProfile | null | undefined
): boolean {
  if (filters && typeof filters.excludeInternalTest === 'boolean') {
    return !filters.excludeInternalTest && isSuperAdminActor(admin);
  }
  if (filters && typeof filters.canViewInternalTestTransactions === 'boolean') {
    return filters.canViewInternalTestTransactions;
  }
  if (filters && typeof filters.canViewInternalTestUsers === 'boolean') {
    return filters.canViewInternalTestUsers;
  }
  return isSuperAdminActor(admin);
}

export function filterInternalTestTransactions<T extends { isInternalTestAccount?: boolean }>(
  transactions: T[],
  canView: boolean
): T[] {
  if (canView) return transactions;
  return transactions.filter((tx) => !tx.isInternalTestAccount);
}

export function shouldShowInternalTestBadge(
  isInternalTestAccount: boolean | undefined,
  canView: boolean
): boolean {
  return Boolean(canView && isInternalTestAccount);
}
