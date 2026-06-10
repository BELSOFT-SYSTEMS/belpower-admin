'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTransactionsList } from '@/lib/adminTransactions';
import type {
  TransactionType,
  TransactionsListData,
  TransactionsListStats,
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

type UseAdminTransactionsListOptions = {
  search: string;
  typeFilter: string;
  statusFilter: string;
  page: number;
  userId?: string;
  limit?: number;
  enabled?: boolean;
};

export function useAdminTransactionsList({
  search,
  typeFilter,
  statusFilter,
  page,
  userId,
  limit = 20,
  enabled = true,
}: UseAdminTransactionsListOptions) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [data, setData] = useState<TransactionsListData | null>(null);
  const [cachedStats, setCachedStats] = useState<TransactionsListStats | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      type:
        typeFilter !== FILTER_ALL ? (typeFilter as TransactionType) : undefined,
      flagged: statusFilter === 'flagged',
      status:
        statusFilter !== FILTER_ALL && statusFilter !== 'flagged'
          ? (statusFilter as TransactionsListData['transactions'][number]['status'])
          : undefined,
      userId,
      sort: 'createdAt:desc' as const,
      includeStats: page === 1,
    }),
    [page, limit, debouncedSearch, typeFilter, statusFilter, userId]
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTransactionsList(queryParams);
      setData(result);
      if (result.stats) {
        setCachedStats(result.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, queryParams]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  return {
    transactions: data?.transactions ?? [],
    quickActions: data?.quickActions ?? DEFAULT_QUICK_ACTIONS,
    filters: data?.filters ?? null,
    stats: cachedStats,
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    refresh,
  };
}
