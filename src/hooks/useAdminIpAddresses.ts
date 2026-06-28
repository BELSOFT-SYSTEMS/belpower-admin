'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getIpAddressStats, getIpAddressesList } from '@/lib/adminIpAddresses';
import type {
  IpAddressCategoryFilter,
  IpAddressesListData,
  IpAddressStats,
} from '@/types/adminIpAddresses';

type UseAdminIpAddressesOptions = {
  page?: number;
  limit?: number;
  category?: IpAddressCategoryFilter;
  search?: string;
};

const EMPTY_STATS: IpAddressStats = {
  activeBlockedCount: 0,
  permanentBannedCount: 0,
  blacklistedCount: 0,
  whitelistedCount: 0,
  autoBlocked24h: 0,
  expiring24h: 0,
};

const EMPTY_LIST: IpAddressesListData = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export function useAdminIpAddresses(options: UseAdminIpAddressesOptions = {}) {
  const { refreshKey } = useAdminAnalytics();
  const [items, setItems] = useState(EMPTY_LIST.items);
  const [pagination, setPagination] = useState(EMPTY_LIST.pagination);
  const [stats, setStats] = useState<IpAddressStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const category = options.category ?? 'all';
  const search = options.search?.trim() || undefined;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (getAdminDemoMode()) {
        setItems([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 1 });
        setStats(EMPTY_STATS);
        return;
      }

      const listPromise = getIpAddressesList({ page, limit, category, search });
      const statsPromise = page === 1 ? getIpAddressStats() : Promise.resolve(null);
      const [listData, statsData] = await Promise.all([listPromise, statsPromise]);

      setItems(listData.items);
      setPagination(listData.pagination);
      if (statsData) setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IP addresses');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, category, search]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  return {
    items,
    pagination,
    stats,
    isLoading,
    error,
    refresh,
  };
}
