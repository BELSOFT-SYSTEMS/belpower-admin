export type AnalyticsScopeFlags = {
  includeDeletedUsers: boolean;
  includePartners: boolean;
  includeBusinesses: boolean;
  excludeRefundedOriginals: boolean;
};

export type AnalyticsDeltaMetric = {
  value: number;
  previous?: number;
  deltaPct?: number | null;
  feeTxs?: number;
  count?: number;
  allTime?: number;
  allTimeCount?: number;
};

export type BuyPowerBalanceKpi = {
  value: number | null;
  currency: string;
  lastUpdated: string | null;
  status: {
    level: 'healthy' | 'warning' | 'critical';
    label: string;
    className: string;
  };
  thresholds: {
    healthyMin: number;
    warningMin: number;
  };
};

export type TransferTopupKpi = {
  available: boolean;
  count?: number;
  total?: number;
  types?: string[];
};

export type RefundedOriginalsKpi = {
  count: number;
  gmv: number;
};

export type AnalyticsMonthlyRow = {
  month: string;
  txs: number;
  feeTxs: number;
  purchaseGmv: number;
  feeGmv: number;
  sc: number;
  commission: number;
  combined: number;
  margin: number;
  deltas?: {
    txs?: number | null;
    feeGmv?: number | null;
    sc?: number | null;
    commission?: number | null;
    combined?: number | null;
  };
};

export type AnalyticsReport = {
  period: { start: string; end: string };
  scope: {
    includeDeletedUsers?: boolean;
    includePartners?: boolean;
    includeBusinesses?: boolean;
    excludeRefundedOriginals?: boolean;
    excludeInternalTest?: boolean;
    excludePartners: boolean;
    excludeBusinesses: boolean;
    excludeDeletedUsers: boolean;
    includeGuests?: boolean;
    note?: string;
  };
  filters?: {
    excludeInternalTest?: boolean;
    canToggleInternalTestExclusion?: boolean;
  };
  kpis: {
    completedPurchases: AnalyticsDeltaMetric;
    feeBearingGmv: AnalyticsDeltaMetric;
    serviceCharges: AnalyticsDeltaMetric;
    buyPowerCommissions: AnalyticsDeltaMetric;
    combinedProfit: AnalyticsDeltaMetric;
    profitMargin: AnalyticsDeltaMetric;
    buyPowerWalletBalance: BuyPowerBalanceKpi;
    transferTopup: TransferTopupKpi;
    refundedOriginals?: RefundedOriginalsKpi;
    totalUsers: { value: number };
    newUsers: { value: number };
    activeBuyers: { value: number };
  };
  charts: {
    feeGmvByMonth: { month: string; value: number }[];
    combinedProfitByMonth: { month: string; value: number }[];
    purchasesByMonth: { month: string; value: number }[];
    scVsCommissionByMonth: { month: string; sc: number; commission: number }[];
    transactionVolumeByMonth: { month: string; value: number }[];
    profitMix: { key: string; label: string; value: number }[];
    paymentForMix: { paymentFor: string; count: number; gmv: number }[];
    userGrowth: { month: string; newUsers: number; cumulativeUsers: number }[];
  };
  monthly: AnalyticsMonthlyRow[];
  ledger: {
    rowCount: number;
    lastSyncedAt: string | null;
    lastOccurredAt: string | null;
    topupsAvailable: boolean;
    topupTypes: string[];
    ensure?: {
      skipped?: boolean;
      reason?: string;
      needsFullSync?: boolean;
      error?: string;
      mode?: string;
    };
  };
  generatedAt: string;
};

export const DEFAULT_ANALYTICS_SCOPE: AnalyticsScopeFlags = {
  includeDeletedUsers: false,
  includePartners: false,
  includeBusinesses: false,
  excludeRefundedOriginals: false,
};
