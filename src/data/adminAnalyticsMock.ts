import type {
  AnalyticsReport,
  AnalyticsScopeFlags,
} from '@/types/adminAnalyticsReports';
import { DEFAULT_ANALYTICS_SCOPE } from '@/types/adminAnalyticsReports';

export function getMockAnalyticsReport(
  scopeInput?: Partial<AnalyticsScopeFlags>
): AnalyticsReport {
  const scope = { ...DEFAULT_ANALYTICS_SCOPE, ...scopeInput };
  const boost =
    (scope.includeDeletedUsers ? 1 : 0) +
    (scope.includePartners ? 1 : 0) +
    (scope.includeBusinesses ? 1 : 0);
  const purchases = 418 + boost * 12;
  const feeGmv = 5483994 + boost * 85000;
  const sc = 30300 + boost * 400;
  const refundedCount = scope.excludeRefundedOriginals ? 0 : 14;
  const refundedGmv = scope.excludeRefundedOriginals ? 0 : 128500;

  const parts = [
    scope.includePartners ? 'partners included' : 'partners excluded',
    scope.includeBusinesses ? 'businesses included' : 'businesses excluded',
    scope.includeDeletedUsers ? 'deleted users included' : 'deleted users excluded',
    'internal test excluded',
    scope.excludeRefundedOriginals
      ? 'refunded originals excluded'
      : 'refunded originals included in KPIs',
  ];

  return {
    period: { start: '2026-01-01', end: '2026-11-13' },
    scope: {
      includeDeletedUsers: scope.includeDeletedUsers,
      includePartners: scope.includePartners,
      includeBusinesses: scope.includeBusinesses,
      excludeRefundedOriginals: scope.excludeRefundedOriginals,
      excludeInternalTest: true,
      excludePartners: !scope.includePartners,
      excludeBusinesses: !scope.includeBusinesses,
      excludeDeletedUsers: !scope.includeDeletedUsers,
      includeGuests: true,
      note: `Demo analytics scope: ${parts.join('; ')}.`,
    },
    filters: {
      excludeInternalTest: true,
      canToggleInternalTestExclusion: true,
    },
    kpis: {
      completedPurchases: { value: purchases, previous: 360, deltaPct: 16.1 },
      feeBearingGmv: { value: feeGmv, previous: 4800000, deltaPct: 14.2 },
      serviceCharges: { value: sc, previous: 28000, deltaPct: 8.2, feeTxs: 303 + boost * 4 },
      buyPowerCommissions: {
        value: 0,
        balance: 0,
        period: 84664.22,
        periodCount: 377,
        previous: 72000,
        deltaPct: null,
        periodDeltaPct: 17.6,
        count: 377,
        allTime: 84664.22,
        allTimeCount: 377,
      },
      combinedProfit: { value: sc + 84664.22, previous: 100000, deltaPct: 15.0 },
      profitMargin: { value: 0.021, previous: 0.019, deltaPct: 10.5 },
      buyPowerWalletBalance: {
        value: 1250000,
        currency: 'NGN',
        lastUpdated: new Date().toISOString(),
        status: {
          level: 'healthy',
          label: 'Healthy',
          className: 'analytics_balance_healthy',
        },
        thresholds: { healthyMin: 1_000_000, warningMin: 500_000 },
        atStartDate: {
          amount: 980000,
          startDate: '2026-01-01',
          source: 'balance_after',
        },
      },
      transferTopup: { available: false, count: 0, total: 0, types: [] },
      refundedOriginals: { count: refundedCount, gmv: refundedGmv },
      totalUsers: { value: 1842 + (scope.includeDeletedUsers ? 40 : 0) },
      newUsers: { value: 126 },
      activeBuyers: { value: 312 + boost * 3 },
    },
    charts: {
      feeGmvByMonth: [
        { month: '2026-06', value: 690000 },
        { month: '2026-07', value: 520000 },
        { month: '2026-08', value: 410000 },
        { month: '2026-09', value: 580000 },
        { month: '2026-10', value: 640000 },
        { month: '2026-11', value: 390000 },
      ],
      combinedProfitByMonth: [
        { month: '2026-06', value: 17400 },
        { month: '2026-07', value: 12100 },
        { month: '2026-08', value: 9800 },
        { month: '2026-09', value: 15200 },
        { month: '2026-10', value: 13400 },
        { month: '2026-11', value: 7200 },
      ],
      purchasesByMonth: [
        { month: '2026-06', value: 34 },
        { month: '2026-07', value: 41 },
        { month: '2026-08', value: 28 },
        { month: '2026-09', value: 39 },
        { month: '2026-10', value: 45 },
        { month: '2026-11', value: 22 },
      ],
      scVsCommissionByMonth: [
        { month: '2026-06', sc: 2600, commission: 14800 },
        { month: '2026-07', sc: 3100, commission: 9000 },
        { month: '2026-08', sc: 2200, commission: 7600 },
        { month: '2026-09', sc: 2900, commission: 12300 },
        { month: '2026-10', sc: 3400, commission: 10000 },
        { month: '2026-11', sc: 1800, commission: 5400 },
      ],
      transactionVolumeByMonth: [
        { month: '2026-06', value: 34 },
        { month: '2026-07', value: 41 },
        { month: '2026-08', value: 28 },
        { month: '2026-09', value: 39 },
        { month: '2026-10', value: 45 },
        { month: '2026-11', value: 22 },
      ],
      profitMix: [
        { key: 'sc', label: 'Service charges (SC)', value: 30300 },
        { key: 'commission', label: 'BuyPower commission', value: 84664.22 },
      ],
      paymentForMix: [
        { paymentFor: 'electricity', count: 280, gmv: 4200000 },
        { paymentFor: 'airtime', count: 60, gmv: 180000 },
        { paymentFor: 'data', count: 48, gmv: 320000 },
        { paymentFor: 'cable', count: 30, gmv: 210000 },
      ],
      userGrowth: [
        { month: '2026-06', newUsers: 18, cumulativeUsers: 1600 },
        { month: '2026-07', newUsers: 22, cumulativeUsers: 1622 },
        { month: '2026-08', newUsers: 15, cumulativeUsers: 1637 },
        { month: '2026-09', newUsers: 28, cumulativeUsers: 1665 },
        { month: '2026-10', newUsers: 31, cumulativeUsers: 1696 },
        { month: '2026-11', newUsers: 20, cumulativeUsers: 1716 },
      ],
    },
    monthly: [
      {
        month: '2026-06',
        txs: 34,
        feeTxs: 26,
        purchaseGmv: 708300,
        feeGmv: 690000,
        sc: 2600,
        commission: 14800,
        combined: 17400,
        margin: 0.025,
        deltas: { txs: 5, feeGmv: 8, sc: 4, commission: 12, combined: 10 },
      },
      {
        month: '2026-07',
        txs: 41,
        feeTxs: 31,
        purchaseGmv: 540000,
        feeGmv: 520000,
        sc: 3100,
        commission: 9000,
        combined: 12100,
        margin: 0.023,
        deltas: { txs: 20.6, feeGmv: -24.6, sc: 19.2, commission: -39.2, combined: -30.5 },
      },
      {
        month: '2026-08',
        txs: 28,
        feeTxs: 22,
        purchaseGmv: 430000,
        feeGmv: 410000,
        sc: 2200,
        commission: 7600,
        combined: 9800,
        margin: 0.024,
        deltas: { txs: -31.7, feeGmv: -21.2, sc: -29, commission: -15.6, combined: -19 },
      },
      {
        month: '2026-09',
        txs: 39,
        feeTxs: 29,
        purchaseGmv: 600000,
        feeGmv: 580000,
        sc: 2900,
        commission: 12300,
        combined: 15200,
        margin: 0.026,
        deltas: { txs: 39.3, feeGmv: 41.5, sc: 31.8, commission: 61.8, combined: 55.1 },
      },
      {
        month: '2026-10',
        txs: 45,
        feeTxs: 34,
        purchaseGmv: 660000,
        feeGmv: 640000,
        sc: 3400,
        commission: 10000,
        combined: 13400,
        margin: 0.021,
        deltas: { txs: 15.4, feeGmv: 10.3, sc: 17.2, commission: -18.7, combined: -11.8 },
      },
      {
        month: '2026-11',
        txs: 22,
        feeTxs: 18,
        purchaseGmv: 410000,
        feeGmv: 390000,
        sc: 1800,
        commission: 5400,
        combined: 7200,
        margin: 0.018,
        deltas: { txs: -51.1, feeGmv: -39.1, sc: -47.1, commission: -46, combined: -46.3 },
      },
    ],
    ledger: {
      rowCount: 754,
      lastSyncedAt: new Date().toISOString(),
      lastOccurredAt: new Date().toISOString(),
      topupsAvailable: false,
      topupTypes: [],
    },
    generatedAt: new Date().toISOString(),
  };
}
