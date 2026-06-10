'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUsersList } from '@/lib/adminUsers';
import type {
  UsersListData,
  UsersPageStats,
  UsersQuickActions,
} from '@/types/adminUsers';

const DEFAULT_QUICK_ACTIONS: UsersQuickActions = {
  block: false,
  suspend: false,
  activate: false,
  message: false,
};

type UseAdminUsersListOptions = {
  search: string;
  statusFilter: string;
  page: number;
  limit?: number;
};

export function useAdminUsersList({
  search,
  statusFilter,
  page,
  limit = 20,
}: UseAdminUsersListOptions) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [data, setData] = useState<UsersListData | null>(null);
  const [cachedStats, setCachedStats] = useState<UsersPageStats | null>(null);
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
      suspicious: statusFilter === 'suspicious',
      status:
        statusFilter !== '__all__' && statusFilter !== 'suspicious'
          ? statusFilter
          : undefined,
      sort: 'lastActiveAt:desc' as const,
      includeStats: page === 1,
    }),
    [page, limit, debouncedSearch, statusFilter]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsersList(queryParams);
      setData(result);
      if (result.stats) {
        setCachedStats(result.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    users: data?.users ?? [],
    quickActions: data?.quickActions ?? DEFAULT_QUICK_ACTIONS,
    filters: data?.filters ?? null,
    stats: cachedStats,
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    refresh,
  };
}
