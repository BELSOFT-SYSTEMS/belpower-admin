'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import { getPartnersList } from '@/lib/adminPartners';
import type {
  PartnersListData,
  PartnersPageStats,
  PartnersQuickActions,
} from '@/types/adminPartners';

const DEFAULT_QUICK_ACTIONS: PartnersQuickActions = {
  approve: false,
  reject: false,
  block: false,
  unblock: false,
  deactivate: false,
  walletCreditManual: false,
  refundsUnblock: false,
};

type UseAdminPartnersListOptions = {
  search: string;
  statusFilter: string;
  page: number;
  limit?: number;
};

export function useAdminPartnersList({
  search,
  statusFilter,
  page,
  limit = 20,
}: UseAdminPartnersListOptions) {
  const { refreshKey } = useAdminAnalytics();
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [data, setData] = useState<PartnersListData | null>(null);
  const [cachedStats, setCachedStats] = useState<PartnersPageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      status:
        statusFilter !== '__all__'
          ? (statusFilter as PartnersListData['filters']['statuses'][number] | 'refunds_blocked')
          : undefined,
      includeStats: page === 1,
    }),
    [page, limit, debouncedSearch, statusFilter]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (getAdminDemoMode()) {
        throw new Error('Partner list demo mode is not configured');
      }
      const result = await getPartnersList(queryParams);
      setData(result);
      if (result.stats) {
        setCachedStats(result.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, refreshKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    partners: data?.partners ?? [],
    quickActions: data?.quickActions ?? DEFAULT_QUICK_ACTIONS,
    filters: data?.filters ?? null,
    stats: cachedStats,
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    refresh,
  };
}
