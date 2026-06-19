'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFraudEventsList, getFraudEventStats } from '@/lib/adminFraud';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import type {
  FraudEventStats,
  FraudEventsListData,
  FraudEventsListParams,
} from '@/types/adminFraud';

type UseAdminFraudEventsOptions = FraudEventsListParams & {
  enabled?: boolean;
  includeStats?: boolean;
};

export function useAdminFraudEvents({
  page = 1,
  limit = 20,
  severity,
  reviewStatus,
  userId,
  code,
  internalTest,
  enabled = true,
  includeStats = true,
}: UseAdminFraudEventsOptions = {}) {
  const { refreshKey } = useAdminAnalytics();
  const [data, setData] = useState<FraudEventsListData | null>(null);
  const [stats, setStats] = useState<FraudEventStats | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      severity,
      reviewStatus,
      userId,
      code,
      internalTest,
    }),
    [page, limit, severity, reviewStatus, userId, code, internalTest]
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const [listResult, statsResult] = await Promise.all([
        getFraudEventsList(queryParams),
        includeStats && page === 1 ? getFraudEventStats() : Promise.resolve(null),
      ]);

      setData(listResult);
      if (statsResult) setStats(statsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fraud events');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, includeStats, page, queryParams, refreshKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    events: data?.items ?? [],
    pagination: data?.pagination ?? null,
    stats,
    isLoading,
    error,
    refresh,
  };
}
