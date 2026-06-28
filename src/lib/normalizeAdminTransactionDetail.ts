import { normalizeApiTransactionListItem } from '@/lib/normalizeTransactionsList';
import type {
  ApiTransactionDetail,
  TransactionDetailData,
  TransactionFraudInfo,
  TransactionManualRequeryInfo,
  TransactionPaymentInfo,
  TransactionRefundInfo,
  TransactionRequeryInfo,
  TransactionReviewStatus,
  TransactionUserInfo,
} from '@/types/adminTransactions';

type RawRecord = Record<string, unknown>;

const REVIEW_STATUSES: TransactionReviewStatus[] = [
  'cleared',
  'under_review',
  'escalated',
  'pending',
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

function pickNumber(raw: RawRecord, camel: string, snake: string): number | null {
  const value = pick<number | string>(raw, camel, snake);
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function pickBool(raw: RawRecord, camel: string, snake: string, fallback = false): boolean {
  const value = pick<boolean>(raw, camel, snake);
  return typeof value === 'boolean' ? value : fallback;
}

const REVIEW_STATUS_ALIASES: Record<string, TransactionReviewStatus> = {
  pending_review: 'pending',
  'pending-review': 'pending',
  underreview: 'under_review',
  'under-review': 'under_review',
};

function normalizeReviewStatus(
  value: unknown,
  isSuspicious: boolean
): TransactionReviewStatus {
  if (value === undefined || value === null || value === '') {
    return isSuspicious ? 'under_review' : 'cleared';
  }

  const text = String(value).toLowerCase().replace(/-/g, '_');
  const aliased = REVIEW_STATUS_ALIASES[text] ?? text;

  if (REVIEW_STATUSES.includes(aliased as TransactionReviewStatus)) {
    return aliased as TransactionReviewStatus;
  }

  return isSuspicious ? 'under_review' : 'cleared';
}

function normalizeFraud(
  raw: RawRecord | undefined,
  fallbackReason: string | null,
  isSuspicious: boolean
): TransactionFraudInfo {
  const source = (raw ?? {}) as RawRecord;

  return {
    reviewStatus: normalizeReviewStatus(
      pick(source, 'reviewStatus', 'review_status'),
      isSuspicious
    ),
    riskReason:
      pickString(source, 'riskReason', 'risk_reason') ??
      fallbackReason,
    auditorNotes: pickString(source, 'auditorNotes', 'auditor_notes'),
    lastReviewedAt: pickString(source, 'lastReviewedAt', 'last_reviewed_at'),
    lastReviewedBy: pickString(source, 'lastReviewedBy', 'last_reviewed_by'),
  };
}

function normalizePayment(
  raw: RawRecord | undefined,
  fallbackMethod: string | null
): TransactionPaymentInfo {
  const source = (raw ?? {}) as RawRecord;

  return {
    method: pickString(source, 'method', 'method') ?? fallbackMethod,
    gatewayReference: pickString(source, 'gatewayReference', 'gateway_reference'),
    walletDebitReference: pickString(source, 'walletDebitReference', 'wallet_debit_reference'),
    providerReference: pickString(source, 'providerReference', 'provider_reference'),
  };
}

function normalizeLastManualRequery(
  raw: RawRecord | undefined | null
): TransactionManualRequeryInfo | null {
  if (!raw) return null;

  const at =
    pickString(raw, 'at', 'at') ??
    pickString(raw, 'requeryAt', 'requery_at');
  const adminId =
    pickString(raw, 'adminId', 'admin_id') ??
    pickString(raw, 'clearedByAdminId', 'cleared_by_admin_id');

  if (!at || !adminId) return null;
  return { at, adminId };
}

function normalizeRefund(raw: RawRecord | undefined): TransactionRefundInfo {
  const source = (raw ?? {}) as RawRecord;

  return {
    eligible: pickBool(source, 'eligible', 'eligible'),
    reason: pickString(source, 'reason', 'reason'),
    amount: pickNumber(source, 'amount', 'amount'),
    walletRefunded: pickBool(source, 'walletRefunded', 'wallet_refunded'),
    refundTransactionId: pickString(source, 'refundTransactionId', 'refund_transaction_id'),
    refundAmount: pickNumber(source, 'refundAmount', 'refund_amount'),
  };
}

function normalizeRequery(raw: RawRecord | undefined, orderId: string | null): TransactionRequeryInfo {
  const source = (raw ?? {}) as RawRecord;

  return {
    eligible: pickBool(source, 'eligible', 'eligible'),
    recommended: pickBool(source, 'recommended', 'recommended'),
    excludeFromAutoRequery: pickBool(
      source,
      'excludeFromAutoRequery',
      'exclude_from_auto_requery'
    ) || pickBool(source, 'excludeFromRequery', 'exclude_from_requery'),
    autoRequeryPaused: pickBool(source, 'autoRequeryPaused', 'auto_requery_paused'),
    autoRequeryPausedReason: pickString(
      source,
      'autoRequeryPausedReason',
      'auto_requery_paused_reason'
    ),
    hasOrderId: pickBool(source, 'hasOrderId', 'has_order_id') || Boolean(orderId),
    orderId:
      pickString(source, 'orderId', 'order_id') ?? orderId,
    supportsBuyPowerRequery: pickBool(
      source,
      'supportsBuyPowerRequery',
      'supports_buy_power_requery'
    ),
    lastRequeryAt: pickString(source, 'lastRequeryAt', 'last_requery_at'),
    requeryCount: pickNumber(source, 'requeryCount', 'requery_count') ?? 0,
    maxRequeryCount: pickNumber(source, 'maxRequeryCount', 'max_requery_count') ?? 12,
    timeoutReason: pickString(source, 'timeoutReason', 'timeout_reason'),
    requeryProcessed: pickBool(source, 'requeryProcessed', 'requery_processed'),
    nextRetryAt: pickString(source, 'nextRetryAt', 'next_retry_at'),
    lastManualRequery: normalizeLastManualRequery(
      pick<RawRecord>(source, 'lastManualRequery', 'last_manual_requery') ??
        pick<RawRecord>(source, 'adminManualRequery', 'admin_manual_requery')
    ),
    reason: pickString(source, 'reason', 'reason'),
  };
}

function normalizeUser(raw: RawRecord | undefined, fallback: TransactionUserInfo): TransactionUserInfo {
  const source = (raw ?? {}) as RawRecord;
  const id = pickString(source, 'id', 'id') ?? fallback.id;
  const fullName =
    pickString(source, 'fullName', 'full_name') ??
    pickString(source, 'name', 'name') ??
    fallback.fullName;

  return {
    id,
    fullName,
    email: pickString(source, 'email', 'email') ?? fallback.email ?? null,
    phone: pickString(source, 'phone', 'phone') ?? fallback.phone ?? null,
    customerType:
      (pickString(source, 'customerType', 'customer_type') ??
        pickString(source, 'type', 'type')) as TransactionUserInfo['customerType'] ??
      fallback.customerType,
    partnerId:
      pickString(source, 'partnerId', 'partner_id') ?? fallback.partnerId ?? null,
    isInternalTestAccount:
      pickBool(source, 'isInternalTestAccount', 'is_internal_test_account') ||
      fallback.isInternalTestAccount ||
      false,
  };
}

export function normalizeAdminTransactionDetail(raw: RawRecord): TransactionDetailData {
  const base = normalizeApiTransactionListItem(raw);
  const fraudReason = base.fraudReason ?? null;
  const paymentMethod = base.paymentMethod ?? null;

  const fraud = normalizeFraud(
    pick<RawRecord>(raw, 'fraud', 'fraud'),
    fraudReason,
    base.isSuspicious
  );
  const payment = normalizePayment(pick<RawRecord>(raw, 'payment', 'payment'), paymentMethod);
  const user = normalizeUser(pick<RawRecord>(raw, 'user', 'user'), {
    id: base.userId || base.partnerId || '',
    fullName: base.userName,
    email: base.customerEmail ?? null,
    phone: base.customerPhone ?? null,
    customerType: base.customerType,
    partnerId: base.partnerId ?? null,
    isInternalTestAccount: base.isInternalTestAccount,
  });

  const quickActionsRaw = (pick<RawRecord>(raw, 'quickActions', 'quick_actions') ?? {}) as RawRecord;
  const canBlock = pickBool(quickActionsRaw, 'block', 'block');
  const orderId = pickString(raw, 'orderId', 'order_id');

  const detail: ApiTransactionDetail = {
    ...base,
    orderId,
    meterNumber: pickString(raw, 'meterNumber', 'meter_number'),
    token: pickString(raw, 'token', 'token'),
    units: pickNumber(raw, 'units', 'units'),
    phoneNumber: pickString(raw, 'phoneNumber', 'phone_number'),
    smartcardNumber: pickString(raw, 'smartcardNumber', 'smartcard_number'),
    packageName: pickString(raw, 'packageName', 'package_name'),
    dataBundle: pickString(raw, 'dataBundle', 'data_bundle'),
    customerName: pickString(raw, 'customerName', 'customer_name'),
    address: pickString(raw, 'address', 'address'),
    fraud,
    payment,
    user,
    requery: normalizeRequery(pick<RawRecord>(raw, 'requery', 'requery'), orderId),
    refund: normalizeRefund(pick<RawRecord>(raw, 'refund', 'refund')),
    generatedAt:
      pickString(raw, 'generatedAt', 'generated_at') ?? new Date().toISOString(),
  };

  return {
    ...detail,
    quickActions: {
      review: pickBool(quickActionsRaw, 'review', 'review'),
      block: canBlock,
      unblock: pickBool(quickActionsRaw, 'unblock', 'unblock'),
      clearReview:
        pickBool(quickActionsRaw, 'clearReview', 'clear_review') || canBlock,
      requery: pickBool(quickActionsRaw, 'requery', 'requery'),
      refund: pickBool(quickActionsRaw, 'refund', 'refund'),
    },
  };
}
