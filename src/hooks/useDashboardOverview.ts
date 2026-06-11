'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getMockDashboardOverview } from '@/data/adminDashboardMock';
import { getDashboardOverview } from '@/lib/adminDashboard';
import { useAdminAuth } from '@/context/AdminAuthContext';
import type { DashboardOverview, DashboardOverviewParams } from '@/types/adminDashboard';

const POLL_MS = 60_000;

type UseDashboardOverviewResult = {
  data: DashboardOverview | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
};

export function useDashboardOverview(
  params: DashboardOverviewParams = {}
): UseDashboardOverviewResult {
  const { admin } = useAdminAuth();
  const { months = 6, recentLimit = 5, userId } = params;
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (silent) setIsRefreshing(true);
      else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const overview = getAdminDemoMode()
          ? getMockDashboardOverview(admin, { months, recentLimit, userId })
          : await getDashboardOverview({ months, recentLimit, userId });
        if (!mountedRef.current) return;
        setData(overview);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        if (!silent) setData(null);
      } finally {
        if (!mountedRef.current) return;
        if (silent) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [admin, months, recentLimit, userId]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (getAdminDemoMode()) return;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true });
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true });
      }
    }, POLL_MS);

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  return { data, isLoading, isRefreshing, error, refresh };
}
