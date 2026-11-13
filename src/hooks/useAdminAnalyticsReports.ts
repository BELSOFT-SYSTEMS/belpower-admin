'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getMockAnalyticsReport } from '@/data/adminAnalyticsMock';
import {
  downloadAnalyticsExport,
  getAnalyticsReport,
  syncBuyPowerLedger,
} from '@/lib/adminAnalyticsReports';
import type {
  AnalyticsReport,
  AnalyticsScopeFlags,
} from '@/types/adminAnalyticsReports';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';

type Options = {
  startDate?: string;
  endDate?: string;
  scope?: AnalyticsScopeFlags;
  enabled?: boolean;
};

export function useAdminAnalyticsReports({
  startDate,
  endDate,
  scope,
  enabled = true,
}: Options) {
  const { refreshKey } = useAdminAnalytics();
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) return;
      if (!opts?.silent) setIsLoading(true);
      setError(null);
      try {
        if (getAdminDemoMode()) {
          setData(getMockAnalyticsReport(scope));
          return;
        }
        const report = await getAnalyticsReport({ startDate, endDate, scope });
        setData(report);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [enabled, startDate, endDate, scope]
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const refreshLedger = useCallback(async () => {
    if (getAdminDemoMode()) {
      setData(getMockAnalyticsReport(scope));
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      await syncBuyPowerLedger({ start: startDate, end: endDate });
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ledger sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [startDate, endDate, load, scope]);

  const exportReport = useCallback(
    async (format: 'pdf' | 'csv') => {
      if (getAdminDemoMode()) {
        setError('Exports are disabled in demo mode');
        return;
      }
      setIsExporting(format);
      setError(null);
      try {
        await downloadAnalyticsExport(format, { startDate, endDate, scope });
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to export ${format}`);
      } finally {
        setIsExporting(null);
      }
    },
    [startDate, endDate, scope]
  );

  return {
    data,
    isLoading,
    isSyncing,
    isExporting,
    error,
    refresh: load,
    refreshLedger,
    exportReport,
  };
}
