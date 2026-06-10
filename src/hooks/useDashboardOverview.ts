'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDashboardOverview } from '@/lib/adminDashboard';
import type { DashboardOverview, DashboardOverviewParams } from '@/types/adminDashboard';

type UseDashboardOverviewResult = {
  data: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDashboardOverview(
  params: DashboardOverviewParams = {}
): UseDashboardOverviewResult {
  const { months = 6, recentLimit = 5, userId } = params;
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await getDashboardOverview({ months, recentLimit, userId });
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [months, recentLimit, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
