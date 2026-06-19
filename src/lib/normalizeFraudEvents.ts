import type {
  FraudActionTaken,
  FraudEvent,
  FraudEventStats,
  FraudEventsListData,
  FraudReviewStatus,
  FraudSeverity,
} from '@/types/adminFraud';

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

function pickNumber(raw: RawRecord, camel: string, snake: string): number | null {
  const value = pick<number>(raw, camel, snake);
  if (value === undefined || value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function pickBool(raw: RawRecord, camel: string, snake: string, fallback = false): boolean {
  const value = pick<boolean>(raw, camel, snake);
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeFraudEvent(raw: RawRecord): FraudEvent {
  const payload = pick<RawRecord>(raw, 'payload', 'payload');

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    userId: pickString(raw, 'userId', 'user_id'),
    userEmail: pickString(raw, 'userEmail', 'user_email'),
    userName: pickString(raw, 'userName', 'user_name'),
    eventType: String(pick(raw, 'eventType', 'event_type') ?? ''),
    code: String(pick(raw, 'code', 'code') ?? ''),
    severity: String(pick(raw, 'severity', 'severity') ?? 'medium') as FraudSeverity,
    message: String(pick(raw, 'message', 'message') ?? ''),
    amount: pickNumber(raw, 'amount', 'amount'),
    paymentFor: pickString(raw, 'paymentFor', 'payment_for'),
    serviceLabel: pickString(raw, 'serviceLabel', 'service_label'),
    paymentMethod: pickString(raw, 'paymentMethod', 'payment_method'),
    ipAddress: pickString(raw, 'ipAddress', 'ip_address'),
    userAgent: pickString(raw, 'userAgent', 'user_agent'),
    requestPath: pickString(raw, 'requestPath', 'request_path'),
    payload: payload && typeof payload === 'object' ? payload : null,
    transactionId: pickString(raw, 'transactionId', 'transaction_id'),
    transactionReference: pickString(raw, 'transactionReference', 'transaction_reference'),
    transactionCreatedAt: pickString(raw, 'transactionCreatedAt', 'transaction_created_at'),
    actionTaken: String(
      pick(raw, 'actionTaken', 'action_taken') ?? 'blocked'
    ) as FraudActionTaken,
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
    reviewStatus: String(
      pick(raw, 'reviewStatus', 'review_status') ?? 'open'
    ) as FraudReviewStatus,
    reviewedAt: pickString(raw, 'reviewedAt', 'reviewed_at'),
    reviewedByAdminId: pickString(raw, 'reviewedByAdminId', 'reviewed_by_admin_id'),
    reviewNotes: pickString(raw, 'reviewNotes', 'review_notes'),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    updatedAt: String(pick(raw, 'updatedAt', 'updated_at') ?? ''),
  };
}

export function normalizeFraudEventsList(raw: RawRecord): FraudEventsListData {
  const itemsRaw = (pick<unknown[]>(raw, 'items', 'items') ?? []) as RawRecord[];
  const paginationRaw = (pick<RawRecord>(raw, 'pagination', 'pagination') ?? {}) as RawRecord;

  return {
    items: itemsRaw.map(normalizeFraudEvent),
    pagination: {
      page: Number(pick(paginationRaw, 'page', 'page') ?? 1),
      limit: Number(pick(paginationRaw, 'limit', 'limit') ?? 20),
      total: Number(pick(paginationRaw, 'total', 'total') ?? 0),
      totalPages: Number(pick(paginationRaw, 'totalPages', 'total_pages') ?? 0),
    },
  };
}

export function normalizeFraudEventStats(raw: RawRecord): FraudEventStats {
  const recentRaw = (pick<unknown[]>(raw, 'recent', 'recent') ?? []) as RawRecord[];

  return {
    openCount: Number(pick(raw, 'openCount', 'open_count') ?? 0),
    criticalOpen: Number(pick(raw, 'criticalOpen', 'critical_open') ?? 0),
    last24h: Number(pick(raw, 'last24h', 'last_24h') ?? 0),
    autoSuspended24h: Number(pick(raw, 'autoSuspended24h', 'auto_suspended_24h') ?? 0),
    recent: recentRaw.map(normalizeFraudEvent),
  };
}
