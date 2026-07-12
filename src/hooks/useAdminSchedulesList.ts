'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSchedulesList } from '@/lib/adminSchedules';
import type { SchedulesListData } from '@/types/adminSchedules';

type UseAdminSchedulesListOptions = {
  search: string;
  statusFilter: string;
  serviceFilter: string;
  userId?: string;
  page: number;
  limit?: number;
};

export function useAdminSchedulesList({
  search,
  statusFilter,
  serviceFilter,
  userId,
  page,
  limit = 20,
}: UseAdminSchedulesListOptions) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [data, setData] = useState<SchedulesListData | null>(null);
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
      status: statusFilter !== '__all__' ? statusFilter : undefined,
      serviceType: serviceFilter !== '__all__' ? serviceFilter : undefined,
      userId,
    }),
    [page, limit, debouncedSearch, statusFilter, serviceFilter, userId]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSchedulesList(queryParams);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    schedules: data?.schedules ?? [],
    pagination: data?.pagination ?? { total: 0, page: 1, limit, totalPages: 1 },
    isLoading,
    error,
    refresh,
  };
}
