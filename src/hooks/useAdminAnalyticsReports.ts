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
    async (opts?: { silent?: boolean }): Promise<AnalyticsReport | null> => {
      if (!enabled) return null;
      if (!opts?.silent) setIsLoading(true);
      setError(null);
      try {
        if (getAdminDemoMode()) {
          const mock = getMockAnalyticsReport(scope);
          setData(mock);
          return mock;
        }
        const report = await getAnalyticsReport({ startDate, endDate, scope });
        setData(report);
        return report;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        return null;
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [enabled, startDate, endDate, scope]
  );

  const refreshLedger = useCallback(async () => {
    if (getAdminDemoMode()) {
      setData(getMockAnalyticsReport(scope));
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      // Full-history sync so all-time BuyPower commission KPIs populate
      await syncBuyPowerLedger({ allTime: true });
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ledger sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [load, scope]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const report = await load();
      if (cancelled || !report || getAdminDemoMode()) return;
      const needsFullSync =
        report.ledger?.ensure?.needsFullSync === true ||
        ((report.ledger?.rowCount ?? 0) === 0 &&
          (report.kpis.buyPowerCommissions?.allTime ?? 0) === 0);
      if (needsFullSync) {
        setIsSyncing(true);
        setError(null);
        try {
          await syncBuyPowerLedger({ allTime: true });
          if (!cancelled) await load({ silent: true });
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Ledger sync failed');
          }
        } finally {
          if (!cancelled) setIsSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey, enabled]);

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
