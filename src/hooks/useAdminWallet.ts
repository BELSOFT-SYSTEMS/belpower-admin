'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWalletOverview } from '@/lib/adminWallet';
import { getTransactionsList } from '@/lib/adminTransactions';
import type { WalletActivityFilter, WalletOverviewStats } from '@/types/adminWallet';
import type {
  ApiTransactionListItem,
  TransactionsQuickActions,
} from '@/types/adminTransactions';

const FILTER_ALL = '__all__';

const DEFAULT_QUICK_ACTIONS: TransactionsQuickActions = {
  review: false,
  block: false,
  unblock: false,
  clearReview: false,
  requery: false,
};

type UseAdminWalletOptions = {
  search: string;
  categoryFilter: WalletActivityFilter | typeof FILTER_ALL;
  statusFilter: string;
  page: number;
  limit?: number;
  enabled?: boolean;
};

function buildListQueryParams({
  search,
  categoryFilter,
  statusFilter,
  page,
  limit,
}: Omit<UseAdminWalletOptions, 'enabled'>) {
  const flagged = statusFilter === 'flagged';

  return {
    page,
    limit,
    search,
    flagged,
    status:
      statusFilter !== FILTER_ALL && !flagged
        ? (statusFilter as 'completed' | 'pending' | 'failed' | 'scheduled')
        : undefined,
    type: categoryFilter === 'deposit' ? ('deposit' as const) : undefined,
    paymentMethod: categoryFilter === 'debit' ? 'wallet' : undefined,
    walletActivity: categoryFilter === FILTER_ALL || categoryFilter === 'all',
    sort: 'createdAt:desc' as const,
    includeStats: false,
  };
}

export function useAdminWallet({
  search,
  categoryFilter,
  statusFilter,
  page,
  limit = 20,
  enabled = true,
}: UseAdminWalletOptions) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [stats, setStats] = useState<WalletOverviewStats | null>(null);
  const [transactions, setTransactions] = useState<ApiTransactionListItem[]>([]);
  const [quickActions, setQuickActions] = useState<TransactionsQuickActions>(DEFAULT_QUICK_ACTIONS);
  const [pagination, setPagination] = useState<{
    page: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listParams = useMemo(
    () =>
      buildListQueryParams({
        search: debouncedSearch,
        categoryFilter:
          categoryFilter === FILTER_ALL ? 'all' : (categoryFilter as WalletActivityFilter),
        statusFilter,
        page,
        limit,
      }),
    [debouncedSearch, categoryFilter, statusFilter, page, limit]
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const [overview, listResult] = await Promise.all([
        page === 1 ? getWalletOverview() : Promise.resolve(null),
        getTransactionsList(listParams),
      ]);

      if (overview) {
        setStats(overview);
      }

      setTransactions(listResult.transactions);
      setQuickActions(listResult.quickActions);
      setPagination(
        listResult.pagination
          ? {
              page: listResult.pagination.page,
              total: listResult.pagination.total,
              totalPages:
                listResult.pagination.totalPages ?? listResult.pagination.total_pages ?? 1,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet activity');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, listParams, page]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  return {
    stats,
    transactions,
    quickActions,
    pagination,
    isLoading,
    error,
    refresh,
  };
}
