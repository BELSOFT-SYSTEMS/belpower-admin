'use client';

import { useCallback, useEffect, useState } from 'react';
import { getServiceReliabilityIndex } from '@/lib/adminServiceReliability';
import type { ServiceReliabilityData } from '@/types/adminServiceReliability';

const AUTO_REFRESH_MS = 60_000;

type UseAdminServiceReliabilityOptions = {
  enabled?: boolean;
  autoRefresh?: boolean;
};

export function useAdminServiceReliability({
  enabled = true,
  autoRefresh = true,
}: UseAdminServiceReliabilityOptions = {}) {
  const [data, setData] = useState<ServiceReliabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) return;

      const silent = options?.silent ?? false;
      if (silent) setIsRefreshing(true);
      else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await getServiceReliabilityIndex();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service reliability');
        if (!silent) setData(null);
      } finally {
        if (silent) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    const timer = window.setInterval(() => {
      refresh({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [enabled, autoRefresh, refresh]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
