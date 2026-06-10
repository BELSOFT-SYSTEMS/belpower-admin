import type {
  AdminMeter,
  AdminUserDetail,
  AdminUserLog,
  AdminUserSecurity,
  AdminUserSession,
  AdminUserTransaction,
  UserDetailQuickActions,
} from '@/types/adminUserDetail';
import type { UserDisplayStatus } from '@/types/adminUsers';

type RawRecord = Record<string, unknown>;

const DISPLAY_STATUSES: UserDisplayStatus[] = [
  'active',
  'new',
  'dormant',
  'blocked',
  'suspended',
  'inactive',
  'deleted',
];

function normalizeDisplayStatus(raw: RawRecord): UserDisplayStatus {
  const value = String(
    pick(raw, 'displayStatus', 'display_status') ?? pick(raw, 'status', 'status') ?? 'active'
  ).toLowerCase();

  return DISPLAY_STATUSES.includes(value as UserDisplayStatus)
    ? (value as UserDisplayStatus)
    : 'active';
}

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

function pickArray(raw: RawRecord, camel: string, snake: string): RawRecord[] {
  const value = pick<unknown[]>(raw, camel, snake);
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function normalizeQuickActions(raw: RawRecord | undefined): UserDetailQuickActions {
  const source = (raw ?? {}) as RawRecord;
  return {
    block: pickBool(source, 'block', 'block'),
    suspend: pickBool(source, 'suspend', 'suspend'),
    activate: pickBool(source, 'activate', 'activate'),
    message: pickBool(source, 'message', 'message'),
    clearSuspicion: pickBool(source, 'clearSuspicion', 'clear_suspicion'),
    delete: pickBool(source, 'delete', 'delete'),
  };
}

function normalizeMeter(raw: RawRecord): AdminMeter {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    meterNumber: String(pick(raw, 'meterNumber', 'meter_number') ?? ''),
    disco: String(pick(raw, 'disco', 'disco') ?? ''),
    customerName: String(pick(raw, 'customerName', 'customer_name') ?? ''),
    address: String(pick(raw, 'address', 'address') ?? ''),
    meterType: (pick(raw, 'meterType', 'meter_type') ?? 'prepaid') as AdminMeter['meterType'],
    isPrimary: pickBool(raw, 'isPrimary', 'is_primary'),
    isVerified: pickBool(raw, 'isVerified', 'is_verified'),
  };
}

function resolveSessionDevice(raw: RawRecord): string {
  const direct = pickString(raw, 'device', 'device');
  if (direct && !/^unknown(\s+device)?$/i.test(direct)) return direct;

  const parts = [
    pickString(raw, 'deviceName', 'device_name'),
    pickString(raw, 'browser', 'browser'),
    pickString(raw, 'os', 'os'),
    pickString(raw, 'platform', 'platform'),
    pickString(raw, 'userAgent', 'user_agent'),
  ].filter((part): part is string => Boolean(part));

  if (parts.length > 0) return parts.join(' — ');
  if (direct) return direct;
  return '—';
}

function normalizeSession(raw: RawRecord): AdminUserSession {
  const device = resolveSessionDevice(raw);

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    device,
    ip: String(pick(raw, 'ip', 'ip') ?? '—'),
    location: pickString(raw, 'location', 'location'),
    lastActiveAt: String(
      pick(raw, 'lastActiveAt', 'last_active_at') ??
        pick(raw, 'lastActive', 'last_active') ??
        ''
    ),
    isCurrent: pickBool(raw, 'isCurrent', 'is_current') || pickBool(raw, 'current', 'current'),
  };
}

function normalizeLog(raw: RawRecord): AdminUserLog {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    action: String(pick(raw, 'action', 'action') ?? '—'),
    detail: String(pick(raw, 'detail', 'detail') ?? '—'),
    createdAt: String(
      pick(raw, 'createdAt', 'created_at') ??
        pick(raw, 'timestamp', 'timestamp') ??
        pick(raw, 'time', 'time') ??
        ''
    ),
    ip: pickString(raw, 'ip', 'ip'),
  };
}

function normalizeTransaction(raw: RawRecord): AdminUserTransaction {
  const scheduled = pick<RawRecord>(raw, 'scheduledInfo', 'scheduled_info');
  const isSuspicious =
    pickBool(raw, 'isSuspicious', 'is_suspicious') ||
    pickBool(raw, 'suspicious', 'suspicious') ||
    pickBool(raw, 'isFlagged', 'is_flagged') ||
    pickBool(raw, 'flagged', 'flagged');

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    reference: String(pick(raw, 'reference', 'reference') ?? ''),
    userId: String(pick(raw, 'userId', 'user_id') ?? ''),
    userName: String(pick(raw, 'userName', 'user_name') ?? ''),
    type: (pick(raw, 'type', 'type') ?? 'deposit') as AdminUserTransaction['type'],
    service: String(pick(raw, 'service', 'service') ?? ''),
    provider: String(pick(raw, 'provider', 'provider') ?? ''),
    amount: pickNumber(raw, 'amount', 'amount') ?? 0,
    amountPurchased: pickNumber(raw, 'amountPurchased', 'amount_purchased'),
    totalAmount: pickNumber(raw, 'totalAmount', 'total_amount') ?? 0,
    serviceCharge: pickNumber(raw, 'serviceCharge', 'service_charge') ?? 0,
    vat: pickNumber(raw, 'vat', 'vat') ?? 0,
    status: (pick(raw, 'status', 'status') ?? 'pending') as AdminUserTransaction['status'],
    createdAt: String(
      pick(raw, 'createdAt', 'created_at') ?? pick(raw, 'created', 'created') ?? ''
    ),
    completedAt: pickString(raw, 'completedAt', 'completed_at'),
    isScheduled:
      pickBool(raw, 'isScheduled', 'is_scheduled') || pickBool(raw, 'scheduled', 'scheduled'),
    scheduledInfo: scheduled
      ? {
          frequency: String(
            pick(scheduled, 'frequency', 'frequency') ?? 'once'
          ),
          nextPurchaseAt: String(
            pick(scheduled, 'nextPurchaseAt', 'next_purchase_at') ??
              pick(scheduled, 'nextPurchase', 'next_purchase') ??
              ''
          ),
        }
      : undefined,
    isSuspicious,
    isBlocked:
      pickBool(raw, 'isBlocked', 'is_blocked') || pickBool(raw, 'blocked', 'blocked'),
    fraudReason: pickString(raw, 'fraudReason', 'fraud_reason'),
    requeryRecommended: pickBool(raw, 'requeryRecommended', 'requery_recommended'),
    requeryReason: pickString(raw, 'requeryReason', 'requery_reason'),
    paymentMethod: pickString(raw, 'paymentMethod', 'payment_method'),
    orderId: pickString(raw, 'orderId', 'order_id'),
    meterNumber: pickString(raw, 'meterNumber', 'meter_number'),
    token: pickString(raw, 'token', 'token'),
    units: pickNumber(raw, 'units', 'units'),
    phoneNumber: pickString(raw, 'phoneNumber', 'phone_number'),
    smartcardNumber: pickString(raw, 'smartcardNumber', 'smartcard_number'),
    packageName: pickString(raw, 'packageName', 'package_name'),
    dataBundle: pickString(raw, 'dataBundle', 'data_bundle'),
    customerName: pickString(raw, 'customerName', 'customer_name'),
    address: pickString(raw, 'address', 'address'),
    isRefund:
      pickBool(raw, 'isRefund', 'is_refund') ||
      String(pick(raw, 'type', 'type') ?? '').toLowerCase() === 'refund',
    isCashback:
      pickBool(raw, 'isCashback', 'is_cashback') ||
      String(pick(raw, 'type', 'type') ?? '').toLowerCase() === 'cashback',
    originalTransactionId: pickString(raw, 'originalTransactionId', 'original_transaction_id'),
    refundReason: pickString(raw, 'refundReason', 'refund_reason'),
    cashbackSourceType: pickString(raw, 'cashbackSourceType', 'cashback_source_type'),
    cashbackRate: pickString(raw, 'cashbackRate', 'cashback_rate'),
    cashbackDescription: pickString(raw, 'cashbackDescription', 'cashback_description'),
  };
}

function normalizeSecurity(raw: RawRecord | undefined): AdminUserSecurity {
  const source = (raw ?? {}) as RawRecord;
  return {
    riskLevel: (pick(source, 'riskLevel', 'risk_level') ?? 'low') as AdminUserSecurity['riskLevel'],
    failedLoginAttempts:
      pickNumber(source, 'failedLoginAttempts', 'failed_login_attempts') ?? 0,
    twoFactorEnabled: pickBool(source, 'twoFactorEnabled', 'two_factor_enabled'),
    lastPasswordChangeAt: pickString(
      source,
      'lastPasswordChangeAt',
      'last_password_change_at'
    ),
    reviewStatus: (pick(source, 'reviewStatus', 'review_status') ??
      'cleared') as AdminUserSecurity['reviewStatus'],
    lastReviewedAt: pickString(source, 'lastReviewedAt', 'last_reviewed_at'),
    lastReviewedBy: pickString(source, 'lastReviewedBy', 'last_reviewed_by'),
    suspiciousTransactionCount:
      pickNumber(source, 'suspiciousTransactionCount', 'suspicious_transaction_count') ??
      undefined,
    latestIp: pickString(source, 'latestIp', 'latest_ip'),
    latestIpScore: pickNumber(source, 'latestIpScore', 'latest_ip_score'),
    maxIpScore: pickNumber(source, 'maxIpScore', 'max_ip_score'),
  };
}

export function normalizeAdminUserDetail(raw: RawRecord): AdminUserDetail {
  const statsRaw = (pick<RawRecord>(raw, 'stats', 'stats') ?? {}) as RawRecord;
  const suspiciousActivity =
    pickBool(raw, 'suspiciousActivity', 'suspicious_activity') ||
    pickBool(raw, 'isSuspicious', 'is_suspicious');

  const primaryMeterRaw = pick<RawRecord>(raw, 'primaryMeter', 'primary_meter');
  const security = normalizeSecurity(pick<RawRecord>(raw, 'security', 'security'));

  const joinedAt = String(
    pick(raw, 'joinedAt', 'joined_at') ??
      pick(raw, 'createdAt', 'created_at') ??
      ''
  );

  const clientSuspiciousTxnCount = pickArray(raw, 'transactions', 'transactions').filter(
    (tx) =>
      pickBool(tx, 'isSuspicious', 'is_suspicious') ||
      pickBool(tx, 'suspicious', 'suspicious') ||
      pickBool(tx, 'flagged', 'flagged')
  ).length;

  const suspiciousTransactionCount =
    pickNumber(raw, 'suspiciousTransactionCount', 'suspicious_transaction_count') ??
    security.suspiciousTransactionCount ??
    clientSuspiciousTxnCount;

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    firstName: String(pick(raw, 'firstName', 'first_name') ?? ''),
    lastName: String(pick(raw, 'lastName', 'last_name') ?? ''),
    fullName: String(
      pick(raw, 'fullName', 'full_name') ??
        `${pick(raw, 'firstName', 'first_name') ?? ''} ${pick(raw, 'lastName', 'last_name') ?? ''}`.trim()
    ),
    email: String(pick(raw, 'email', 'email') ?? ''),
    phone: pickString(raw, 'phone', 'phone'),
    status: String(pick(raw, 'status', 'status') ?? ''),
    displayStatus: normalizeDisplayStatus(raw),
    avatar: null,

    isSuspicious: pickBool(raw, 'isSuspicious', 'is_suspicious') || suspiciousActivity,
    suspiciousActivity,
    suspiciousReasons: (pick<string[]>(raw, 'suspiciousReasons', 'suspicious_reasons') ??
      []) as string[],
    riskScore: pickNumber(raw, 'riskScore', 'risk_score') ?? 0,
    suspiciousTransactionCount,
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
    deletedAt: pickString(raw, 'deletedAt', 'deleted_at'),

    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? joinedAt),
    joinedAt,
    lastActiveAt: pickString(raw, 'lastActiveAt', 'last_active_at'),
    lastActive: pickString(raw, 'lastActive', 'last_active'),
    lastLoginAt: pickString(raw, 'lastLoginAt', 'last_login_at'),
    emailVerified: pickBool(raw, 'emailVerified', 'email_verified'),
    phoneVerified: pickBool(raw, 'phoneVerified', 'phone_verified'),

    stats: {
      walletBalance: pickNumber(statsRaw, 'walletBalance', 'wallet_balance') ?? 0,
      highestTransactionAmount: pickNumber(
        statsRaw,
        'highestTransactionAmount',
        'highest_transaction_amount'
      ),
      lastTransactionAmount: pickNumber(
        statsRaw,
        'lastTransactionAmount',
        'last_transaction_amount'
      ),
      totalSpent: pickNumber(statsRaw, 'totalSpent', 'total_spent') ?? 0,
      transactionCount:
        pickNumber(statsRaw, 'transactionCount', 'transaction_count') ?? 0,
    },

    quickActions: normalizeQuickActions(
      pick<RawRecord>(raw, 'quickActions', 'quick_actions')
    ),

    primaryMeter: primaryMeterRaw ? normalizeMeter(primaryMeterRaw) : null,
    savedMeters: pickArray(raw, 'savedMeters', 'saved_meters').map(normalizeMeter),

    sessions: pickArray(raw, 'sessions', 'sessions').map(normalizeSession),
    logs: pickArray(raw, 'logs', 'logs').map(normalizeLog),
    transactions: pickArray(raw, 'transactions', 'transactions').map(normalizeTransaction),

    security,

    generatedAt: String(
      pick(raw, 'generatedAt', 'generated_at') ?? new Date().toISOString()
    ),
  };
}
