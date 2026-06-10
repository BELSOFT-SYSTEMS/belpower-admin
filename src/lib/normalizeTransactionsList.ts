import type {
  ApiTransactionListItem,
  TransactionStatus,
  TransactionType,
  TransactionsListData,
  TransactionsListFilters,
  TransactionsListStats,
} from '@/types/adminTransactions';

type RawRecord = Record<string, unknown>;

const TRANSACTION_TYPES: TransactionType[] = [
  'electricity',
  'airtime',
  'data',
  'cable',
  'deposit',
  'refund',
  'cashback',
];

const TRANSACTION_STATUSES: TransactionStatus[] = [
  'completed',
  'pending',
  'failed',
  'scheduled',
];

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

function normalizeTransactionType(value: unknown): TransactionType {
  const text = String(value ?? 'electricity').toLowerCase();
  return TRANSACTION_TYPES.includes(text as TransactionType)
    ? (text as TransactionType)
    : 'electricity';
}

function normalizeTransactionStatus(value: unknown): TransactionStatus {
  const text = String(value ?? 'pending').toLowerCase();
  return TRANSACTION_STATUSES.includes(text as TransactionStatus)
    ? (text as TransactionStatus)
    : 'pending';
}

function normalizeScheduledInfo(raw: RawRecord | undefined | null) {
  if (!raw) return undefined;

  const nextPurchaseAt =
    pickString(raw, 'nextPurchaseAt', 'next_purchase_at') ??
    pickString(raw, 'nextPurchase', 'next_purchase');

  if (!nextPurchaseAt) return undefined;

  return {
    frequency: String(pick(raw, 'frequency', 'frequency') ?? 'once'),
    nextPurchaseAt,
  };
}

export function normalizeApiTransactionListItem(raw: RawRecord): ApiTransactionListItem {
  const scheduledInfoRaw = pick<RawRecord>(raw, 'scheduledInfo', 'scheduled_info');

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    reference: String(pick(raw, 'reference', 'reference') ?? ''),
    userId: String(pick(raw, 'userId', 'user_id') ?? ''),
    userName: String(pick(raw, 'userName', 'user_name') ?? ''),
    type: normalizeTransactionType(pick(raw, 'type', 'type')),
    service: String(pick(raw, 'service', 'service') ?? ''),
    provider: String(pick(raw, 'provider', 'provider') ?? ''),
    amount: pickNumber(raw, 'amount', 'amount'),
    amountPurchased: pickNumber(raw, 'amountPurchased', 'amount_purchased'),
    totalAmount: pickNumber(raw, 'totalAmount', 'total_amount'),
    serviceCharge: pickNumber(raw, 'serviceCharge', 'service_charge'),
    vat: pickNumber(raw, 'vat', 'vat'),
    status: normalizeTransactionStatus(pick(raw, 'status', 'status')),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    completedAt: pickString(raw, 'completedAt', 'completed_at'),
    isScheduled:
      pickBool(raw, 'isScheduled', 'is_scheduled') ||
      normalizeTransactionStatus(pick(raw, 'status', 'status')) === 'scheduled',
    scheduledInfo: normalizeScheduledInfo(scheduledInfoRaw),
    isSuspicious:
      pickBool(raw, 'isSuspicious', 'is_suspicious') ||
      pickBool(raw, 'suspicious', 'suspicious'),
    isBlocked:
      pickBool(raw, 'isBlocked', 'is_blocked') || pickBool(raw, 'blocked', 'blocked'),
    fraudReason: pickString(raw, 'fraudReason', 'fraud_reason'),
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
    paymentMethod: pickString(raw, 'paymentMethod', 'payment_method'),
    requeryRecommended: pickBool(raw, 'requeryRecommended', 'requery_recommended'),
    requeryReason: pickString(raw, 'requeryReason', 'requery_reason'),
    isRefund:
      pickBool(raw, 'isRefund', 'is_refund') ||
      normalizeTransactionType(pick(raw, 'type', 'type')) === 'refund',
    isCashback:
      pickBool(raw, 'isCashback', 'is_cashback') ||
      normalizeTransactionType(pick(raw, 'type', 'type')) === 'cashback',
    originalTransactionId: pickString(raw, 'originalTransactionId', 'original_transaction_id'),
    refundReason: pickString(raw, 'refundReason', 'refund_reason'),
    cashbackSourceType: pickString(raw, 'cashbackSourceType', 'cashback_source_type'),
    cashbackRate: pickString(raw, 'cashbackRate', 'cashback_rate'),
    cashbackDescription: pickString(raw, 'cashbackDescription', 'cashback_description'),
  };
}

function normalizeCountStat(raw: RawRecord | undefined) {
  if (!raw) return undefined;
  return {
    count: pickNumber(raw, 'count', 'count'),
    definition: String(pick(raw, 'definition', 'definition') ?? ''),
  };
}

function normalizeCountVolumeStat(raw: RawRecord | undefined) {
  if (!raw) return undefined;
  return {
    amount: pickNumber(raw, 'amount', 'amount'),
    count: pickNumber(raw, 'count', 'count'),
    definition: String(pick(raw, 'definition', 'definition') ?? ''),
  };
}

function normalizeVolumeStat(raw: RawRecord | undefined) {
  if (!raw) return undefined;
  return {
    amount: pickNumber(raw, 'amount', 'amount'),
    currency: 'NGN' as const,
    definition: String(pick(raw, 'definition', 'definition') ?? ''),
  };
}

function countStatFromVolume(
  countStat: ReturnType<typeof normalizeCountStat>,
  volumeStat: ReturnType<typeof normalizeCountVolumeStat>
) {
  if (countStat) return countStat;
  if (!volumeStat) return undefined;
  return {
    count: volumeStat.count,
    definition: volumeStat.definition,
  };
}

function normalizeStats(raw: RawRecord | null | undefined): TransactionsListStats | null {
  if (!raw) return null;

  const totalVolume = normalizeVolumeStat(
    pick<RawRecord>(raw, 'totalVolume', 'total_volume')
  );
  const completed = normalizeCountVolumeStat(
    pick<RawRecord>(raw, 'completed', 'completed')
  );
  const pending = normalizeCountVolumeStat(pick<RawRecord>(raw, 'pending', 'pending'));
  const refunds = normalizeCountVolumeStat(pick<RawRecord>(raw, 'refunds', 'refunds'));

  const totalTransactions = normalizeCountStat(
    pick<RawRecord>(raw, 'totalTransactions', 'total_transactions')
  );
  const completedTransactions = countStatFromVolume(
    normalizeCountStat(
      pick<RawRecord>(raw, 'completedTransactions', 'completed_transactions')
    ),
    completed
  );
  const pendingTransactions = countStatFromVolume(
    normalizeCountStat(
      pick<RawRecord>(raw, 'pendingTransactions', 'pending_transactions')
    ),
    pending
  );
  const refundTransactions = countStatFromVolume(
    normalizeCountStat(pick<RawRecord>(raw, 'refundTransactions', 'refund_transactions')),
    refunds
  );

  const scheduled = normalizeCountStat(pick<RawRecord>(raw, 'scheduled', 'scheduled'));
  const flagged = normalizeCountStat(pick<RawRecord>(raw, 'flagged', 'flagged'));

  if (
    !completedTransactions ||
    !pendingTransactions ||
    !refundTransactions ||
    !scheduled ||
    !flagged
  ) {
    return null;
  }

  return {
    totalVolume: totalVolume ?? null,
    completed: completed ?? null,
    pending: pending ?? null,
    refunds: refunds ?? null,
    totalTransactions: totalTransactions ?? {
      count: 0,
      definition: '',
    },
    completedTransactions,
    pendingTransactions,
    refundTransactions,
    scheduled,
    flagged,
  };
}

function normalizeFilters(raw: RawRecord | undefined): TransactionsListFilters {
  const source = (raw ?? {}) as RawRecord;
  const types = (pick<string[]>(source, 'types', 'types') ?? TRANSACTION_TYPES).map((t) =>
    normalizeTransactionType(t)
  );

  return {
    types,
    statuses: (pick<string[]>(source, 'statuses', 'statuses') ?? [
      'completed',
      'pending',
      'failed',
      'scheduled',
      'flagged',
    ]) as TransactionsListFilters['statuses'],
    canViewInternalTestTransactions: pickBool(
      source,
      'canViewInternalTestTransactions',
      'can_view_internal_test_transactions'
    ),
    canViewMoneyStats: pickBool(
      source,
      'canViewMoneyStats',
      'can_view_money_stats'
    ),
    appliedType: pickString(source, 'appliedType', 'applied_type'),
    appliedStatus: pickString(source, 'appliedStatus', 'applied_status'),
    appliedFlagged: pickBool(source, 'appliedFlagged', 'applied_flagged'),
    appliedUserId: pickString(source, 'appliedUserId', 'applied_user_id'),
  };
}

export function normalizeTransactionsList(raw: RawRecord): TransactionsListData {
  const transactions = (pick<unknown[]>(raw, 'transactions', 'transactions') ?? []) as RawRecord[];
  const paginationRaw = (pick<RawRecord>(raw, 'pagination', 'pagination') ?? {}) as RawRecord;
  const quickActionsRaw = (pick<RawRecord>(raw, 'quickActions', 'quick_actions') ?? {}) as RawRecord;

  return {
    stats: normalizeStats(pick<RawRecord>(raw, 'stats', 'stats')),
    quickActions: {
      review: pickBool(quickActionsRaw, 'review', 'review'),
      block: pickBool(quickActionsRaw, 'block', 'block'),
      unblock: pickBool(quickActionsRaw, 'unblock', 'unblock'),
      clearReview: pickBool(quickActionsRaw, 'clearReview', 'clear_review'),
      requery: pickBool(quickActionsRaw, 'requery', 'requery'),
    },
    transactions: transactions.map(normalizeApiTransactionListItem),
    pagination: {
      page: pickNumber(paginationRaw, 'page', 'page', 1) || 1,
      limit: pickNumber(paginationRaw, 'limit', 'limit', 20) || 20,
      total: pickNumber(paginationRaw, 'total', 'total'),
      totalPages:
        pickNumber(paginationRaw, 'totalPages', 'total_pages', 1) ||
        pickNumber(paginationRaw, 'total_pages', 'total_pages', 1) ||
        1,
      total_pages:
        pickNumber(paginationRaw, 'totalPages', 'total_pages', 1) ||
        pickNumber(paginationRaw, 'total_pages', 'total_pages', 1) ||
        1,
    },
    filters: normalizeFilters(pick<RawRecord>(raw, 'filters', 'filters')),
    generatedAt: pickString(raw, 'generatedAt', 'generated_at') ?? undefined,
  };
}
