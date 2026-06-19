import type {
  DashboardCharts,
  DashboardFilters,
  DashboardFraudEvent,
  DashboardFraudSummary,
  DashboardNewUser,
  DashboardOverview,
  DashboardRecentTransaction,
  DashboardStats,
} from '@/types/adminDashboard';

type RawRecord = Record<string, unknown>;

function pick<T>(raw: RawRecord, camel: string, snake: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

function pickString(raw: RawRecord, camel: string, snake: string): string | null {
  const value = pick<string>(raw, camel, snake);
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function pickBool(raw: RawRecord, camel: string, snake: string, fallback = false): boolean {
  const value = pick<boolean>(raw, camel, snake);
  return typeof value === 'boolean' ? value : fallback;
}

function pickNumber(raw: RawRecord, camel: string, snake: string, fallback = 0): number {
  const value = pick<number>(raw, camel, snake);
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRecentTransaction(raw: RawRecord): DashboardRecentTransaction {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    reference: String(pick(raw, 'reference', 'reference') ?? ''),
    userId: pickString(raw, 'userId', 'user_id'),
    guestUserId: pickString(raw, 'guestUserId', 'guest_user_id'),
    userName: String(pick(raw, 'userName', 'user_name') ?? ''),
    amount: pickNumber(raw, 'amount', 'amount'),
    currency: String(pick(raw, 'currency', 'currency') ?? 'NGN'),
    status: String(pick(raw, 'status', 'status') ?? ''),
    type: String(pick(raw, 'type', 'type') ?? ''),
    paymentFor: String(pick(raw, 'paymentFor', 'payment_for') ?? ''),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
  };
}

function normalizeNewUser(raw: RawRecord): DashboardNewUser {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    firstName: String(pick(raw, 'firstName', 'first_name') ?? ''),
    lastName: String(pick(raw, 'lastName', 'last_name') ?? ''),
    fullName: String(
      pick(raw, 'fullName', 'full_name') ??
        `${pick(raw, 'firstName', 'first_name') ?? ''} ${pick(raw, 'lastName', 'last_name') ?? ''}`.trim()
    ),
    email: String(pick(raw, 'email', 'email') ?? ''),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
  };
}

function normalizeStats(raw: RawRecord | undefined): DashboardStats {
  const source = (raw ?? {}) as RawRecord;
  const totalPaymentsRaw = (pick<RawRecord>(source, 'totalPayments', 'total_payments') ??
    {}) as RawRecord;

  return {
    totalPayments: {
      visible: pickBool(totalPaymentsRaw, 'visible', 'visible'),
      amount: pickNumber(totalPaymentsRaw, 'amount', 'amount'),
      currency: String(pick(totalPaymentsRaw, 'currency', 'currency') ?? 'NGN'),
    },
    totalTransactions: pickNumber(source, 'totalTransactions', 'total_transactions'),
    activeUsers: pickNumber(source, 'activeUsers', 'active_users'),
    pendingTransactions: pickNumber(source, 'pendingTransactions', 'pending_transactions'),
  };
}

function normalizeCharts(raw: RawRecord | undefined): DashboardCharts {
  const source = (raw ?? {}) as RawRecord;
  const revenueRaw = (pick<RawRecord>(source, 'revenueOverview', 'revenue_overview') ??
    {}) as RawRecord;
  const revenueSeries = (pick<unknown[]>(revenueRaw, 'series', 'series') ?? []) as RawRecord[];

  const mapCountSeries = (key: string, snake: string) =>
    ((pick<unknown[]>(source, key, snake) ?? []) as RawRecord[]).map((point) => ({
      month: String(pick(point, 'month', 'month') ?? ''),
      count: pickNumber(point, 'count', 'count'),
    }));

  return {
    revenueOverview: {
      visible: pickBool(revenueRaw, 'visible', 'visible'),
      series: revenueSeries.map((point) => ({
        month: String(pick(point, 'month', 'month') ?? ''),
        amount: pickNumber(point, 'amount', 'amount'),
      })),
    },
    transactionVolume: mapCountSeries('transactionVolume', 'transaction_volume'),
    userGrowth: mapCountSeries('userGrowth', 'user_growth'),
  };
}

function normalizeFraudEvent(raw: RawRecord): DashboardFraudEvent {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    userId: pickString(raw, 'userId', 'user_id'),
    userEmail: pickString(raw, 'userEmail', 'user_email'),
    userName: pickString(raw, 'userName', 'user_name'),
    eventType: String(pick(raw, 'eventType', 'event_type') ?? ''),
    code: String(pick(raw, 'code', 'code') ?? ''),
    severity: String(pick(raw, 'severity', 'severity') ?? ''),
    message: String(pick(raw, 'message', 'message') ?? ''),
    amount: pickNumber(raw, 'amount', 'amount'),
    actionTaken: String(pick(raw, 'actionTaken', 'action_taken') ?? ''),
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
    reviewStatus: String(pick(raw, 'reviewStatus', 'review_status') ?? ''),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
  };
}

function normalizeFraudSummary(raw: RawRecord | undefined): DashboardFraudSummary {
  const source = (raw ?? {}) as RawRecord;
  const recentRaw = (pick<unknown[]>(source, 'recent', 'recent') ?? []) as RawRecord[];

  return {
    visible: pickBool(source, 'visible', 'visible'),
    openCount: pickNumber(source, 'openCount', 'open_count'),
    criticalOpen: pickNumber(source, 'criticalOpen', 'critical_open'),
    last24h: pickNumber(source, 'last24h', 'last_24h'),
    autoSuspended24h: pickNumber(source, 'autoSuspended24h', 'auto_suspended_24h'),
    recent: recentRaw.map(normalizeFraudEvent),
  };
}

function normalizeFilters(raw: RawRecord | undefined): DashboardFilters {
  const source = (raw ?? {}) as RawRecord;

  return {
    canViewInternalTestUsers: pickBool(
      source,
      'canViewInternalTestUsers',
      'can_view_internal_test_users'
    ),
    canViewDeletedUsers: pickBool(source, 'canViewDeletedUsers', 'can_view_deleted_users'),
    appliedUserId: pickString(source, 'appliedUserId', 'applied_user_id'),
  };
}

export function normalizeDashboardOverview(raw: RawRecord): DashboardOverview {
  const recentTransactions = (pick<unknown[]>(raw, 'recentTransactions', 'recent_transactions') ??
    []) as RawRecord[];
  const newUsers = (pick<unknown[]>(raw, 'newUsers', 'new_users') ?? []) as RawRecord[];

  return {
    stats: normalizeStats(pick<RawRecord>(raw, 'stats', 'stats')),
    recentTransactions: recentTransactions.map(normalizeRecentTransaction),
    newUsers: newUsers.map(normalizeNewUser),
    charts: normalizeCharts(pick<RawRecord>(raw, 'charts', 'charts')),
    filters: normalizeFilters(pick<RawRecord>(raw, 'filters', 'filters')),
    fraudSummary: normalizeFraudSummary(
      pick<RawRecord>(raw, 'fraudSummary', 'fraud_summary')
    ),
    generatedAt: String(pick(raw, 'generatedAt', 'generated_at') ?? ''),
  };
}
