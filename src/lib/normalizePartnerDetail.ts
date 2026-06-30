import type { PartnerDetail, PartnersQuickActions } from '@/types/adminPartners';

type RawRecord = Record<string, unknown>;

function pick<T>(raw: RawRecord, camel: string, snake: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

function pickNumber(raw: RawRecord, camel: string, snake: string, fallback = 0): number {
  const value = pick<number | string>(raw, camel, snake);
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
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

export function normalizePartnerDetail(raw: RawRecord): PartnerDetail {
  const quickActions =
    (pick<PartnersQuickActions>(raw, 'quickActions', 'quick_actions') as PartnersQuickActions) ??
    ({} as PartnersQuickActions);

  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    agentFullName: String(pick(raw, 'agentFullName', 'agent_full_name') ?? ''),
    tradingName: pickString(raw, 'tradingName', 'trading_name'),
    businessName: String(pick(raw, 'businessName', 'business_name') ?? ''),
    cacRegistrationNumber: String(
      pick(raw, 'cacRegistrationNumber', 'cac_registration_number') ?? ''
    ),
    phone: String(pick(raw, 'phone', 'phone') ?? ''),
    email: String(pick(raw, 'email', 'email') ?? ''),
    status: pick(raw, 'status', 'status') as PartnerDetail['status'],
    emailVerified: pickBool(raw, 'emailVerified', 'email_verified'),
    walletBalance: pickNumber(raw, 'walletBalance', 'wallet_balance'),
    canAccessDashboard: pickBool(raw, 'canAccessDashboard', 'can_access_dashboard'),
    refundsBlocked: pickBool(raw, 'refundsBlocked', 'refunds_blocked'),
    refundsBlockedAt: pickString(raw, 'refundsBlockedAt', 'refunds_blocked_at'),
    refundsBlockedReason: pickString(raw, 'refundsBlockedReason', 'refunds_blocked_reason'),
    refundsUnblockedAt: pickString(raw, 'refundsUnblockedAt', 'refunds_unblocked_at'),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    lastLoginAt: pickString(raw, 'lastLoginAt', 'last_login_at') ?? undefined,
    agreedToTerms: pickBool(raw, 'agreedToTerms', 'agreed_to_terms'),
    notifyDiscoOutages: pickBool(raw, 'notifyDiscoOutages', 'notify_disco_outages'),
    notifyLowBalance: pickBool(raw, 'notifyLowBalance', 'notify_low_balance', true),
    notifyNewsUpdates: pickBool(raw, 'notifyNewsUpdates', 'notify_news_updates', true),
    approvedAt: pickString(raw, 'approvedAt', 'approved_at'),
    rejectedAt: pickString(raw, 'rejectedAt', 'rejected_at'),
    rejectionReason: pickString(raw, 'rejectionReason', 'rejection_reason'),
    transactionTotal: pickNumber(raw, 'transactionTotal', 'transaction_total'),
    apiKeys:
      (pick(raw, 'apiKeys', 'api_keys') as PartnerDetail['apiKeys']) ?? [],
    quickActions,
  };
}
