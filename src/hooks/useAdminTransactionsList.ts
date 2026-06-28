'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getMockTransactionsList } from '@/data/adminListPagesMock';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import { getTransactionsList } from '@/lib/adminTransactions';
import type {
  TransactionType,
  TransactionsListData,
  TransactionsListStats,
  TransactionsQuickActions,
} from '@/types/adminTransactions';
import {
  filterInternalTestTransactions,
  resolveCanViewInternalTest,
} from '@/utils/adminInternalTestAccess';
import { canViewTransactionMoneyStats } from '@/utils/adminTransactionStatsAccess';

const FILTER_ALL = '__all__';

const DEFAULT_QUICK_ACTIONS: TransactionsQuickActions = {
  review: false,
  block: false,
  unblock: false,
  clearReview: false,
  requery: false,
  refund: false,
};

type UseAdminTransactionsListOptions = {
  search: string;
  typeFilter: string;
  statusFilter: string;
  page: number;
  userId?: string;
  partnerId?: string;
  limit?: number;
  enabled?: boolean;
};

export function useAdminTransactionsList({
  search,
  typeFilter,
  statusFilter,
  page,
  userId,
  partnerId,
  limit = 20,
  enabled = true,
}: UseAdminTransactionsListOptions) {
  const { admin } = useAdminAuth();
  const { refreshKey } = useAdminAnalytics();
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
      partnerId,
      sort: 'createdAt:desc' as const,
      includeStats: page === 1,
    }),
    [page, limit, debouncedSearch, typeFilter, statusFilter, userId, partnerId]
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = getAdminDemoMode()
        ? getMockTransactionsList(admin, queryParams)
        : await getTransactionsList(queryParams);
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
  }, [admin, enabled, queryParams, refreshKey]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  const canViewInternalTestTransactions = useMemo(
    () => resolveCanViewInternalTest(data?.filters, admin),
    [data?.filters, admin]
  );

  const canViewMoneyStats = useMemo(
    () => canViewTransactionMoneyStats(admin, data?.filters),
    [admin, data?.filters]
  );

  const transactions = useMemo(
    () =>
      filterInternalTestTransactions(
        data?.transactions ?? [],
        canViewInternalTestTransactions
      ),
    [data?.transactions, canViewInternalTestTransactions]
  );

  return {
    transactions,
    quickActions: data?.quickActions ?? DEFAULT_QUICK_ACTIONS,
    filters: data?.filters ?? null,
    canViewInternalTestTransactions,
    canViewMoneyStats,
    stats: cachedStats,
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    refresh,
  };
}
