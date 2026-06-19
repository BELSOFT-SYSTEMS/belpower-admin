import { ADMIN_USER_MESSAGING_ENABLED } from '@/constants/adminFeatureFlags';
import type {
  ApiUser,
  UserDisplayStatus,
  UsersListData,
  UsersListFilters,
  UsersPageStats,
} from '@/types/adminUsers';

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

function normalizeDisplayStatus(raw: RawRecord): UserDisplayStatus {
  const value = String(
    pick(raw, 'displayStatus', 'display_status') ?? pick(raw, 'status', 'status') ?? 'active'
  ).toLowerCase();

  return DISPLAY_STATUSES.includes(value as UserDisplayStatus)
    ? (value as UserDisplayStatus)
    : 'active';
}

function normalizeUser(raw: RawRecord): ApiUser {
  return {
    id: String(pick(raw, 'id', 'id') ?? ''),
    firstName: String(pick(raw, 'firstName', 'first_name') ?? ''),
    lastName: String(pick(raw, 'lastName', 'last_name') ?? ''),
    fullName: String(
      pick(raw, 'fullName', 'full_name') ??
        `${pick(raw, 'firstName', 'first_name') ?? ''} ${pick(raw, 'lastName', 'last_name') ?? ''}`.trim()
    ),
    email: String(pick(raw, 'email', 'email') ?? ''),
    status: String(pick(raw, 'status', 'status') ?? ''),
    displayStatus: normalizeDisplayStatus(raw),
    suspiciousActivity:
      pickBool(raw, 'suspiciousActivity', 'suspicious_activity') ||
      pickBool(raw, 'isSuspicious', 'is_suspicious'),
    isSuspicious:
      pickBool(raw, 'isSuspicious', 'is_suspicious') ||
      pickBool(raw, 'suspiciousActivity', 'suspicious_activity'),
    riskScore: Number(pick(raw, 'riskScore', 'risk_score') ?? 0) || 0,
    suspiciousReasons: (pick<string[]>(raw, 'suspiciousReasons', 'suspicious_reasons') ??
      []) as string[],
    lastActiveAt: pickString(raw, 'lastActiveAt', 'last_active_at'),
    lastActive: pickString(raw, 'lastActive', 'last_active'),
    lastLoginAt: pickString(raw, 'lastLoginAt', 'last_login_at'),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    deletedAt: pickString(raw, 'deletedAt', 'deleted_at'),
    isInternalTestAccount: pickBool(raw, 'isInternalTestAccount', 'is_internal_test_account'),
    avatar: null,
  };
}

function normalizeStatBlock(
  raw: RawRecord | undefined,
  extra?: Partial<{ period: '7d' }>
) {
  if (!raw) return undefined;

  return {
    count: Number(pick(raw, 'count', 'count') ?? 0) || 0,
    definition: String(pick(raw, 'definition', 'definition') ?? ''),
    ...extra,
  };
}

function normalizeStats(raw: RawRecord | null | undefined): UsersPageStats | null {
  if (!raw) return null;

  const newUsers = normalizeStatBlock(pick<RawRecord>(raw, 'newUsers', 'new_users'), {
    period: '7d',
  });
  const activeUsers = normalizeStatBlock(pick<RawRecord>(raw, 'activeUsers', 'active_users'));
  const flaggedUsers = normalizeStatBlock(pick<RawRecord>(raw, 'flaggedUsers', 'flagged_users'));

  if (!newUsers || !activeUsers || !flaggedUsers) return null;

  return {
    totalUsers: normalizeStatBlock(pick<RawRecord>(raw, 'totalUsers', 'total_users')),
    newUsers: newUsers as UsersPageStats['newUsers'],
    activeUsers,
    flaggedUsers,
    blockedUsers:
      normalizeStatBlock(pick<RawRecord>(raw, 'blockedUsers', 'blocked_users')) ?? {
        count: 0,
        definition: 'status_blocked',
      },
    suspendedUsers:
      normalizeStatBlock(pick<RawRecord>(raw, 'suspendedUsers', 'suspended_users')) ?? {
        count: 0,
        definition: 'status_suspended',
      },
    deletedUsers: normalizeStatBlock(pick<RawRecord>(raw, 'deletedUsers', 'deleted_users')),
  };
}

function normalizeFilters(raw: RawRecord | undefined): UsersListFilters {
  const source = (raw ?? {}) as RawRecord;
  const statuses = pick<string[]>(source, 'statuses', 'statuses') ?? [
    'active',
    'new',
    'dormant',
    'blocked',
    'suspended',
    'inactive',
  ];

  return {
    statuses: statuses.map((s) => s.toLowerCase()) as UserDisplayStatus[],
    canViewDeletedUsers: pickBool(source, 'canViewDeletedUsers', 'can_view_deleted_users'),
    canViewInternalTestUsers: pickBool(
      source,
      'canViewInternalTestUsers',
      'can_view_internal_test_users'
    ),
    appliedStatus: pickString(source, 'appliedStatus', 'applied_status'),
    includeDeleted: pickBool(source, 'includeDeleted', 'include_deleted'),
  };
}

export function normalizeUsersList(raw: RawRecord): UsersListData {
  const users = (pick<unknown[]>(raw, 'users', 'users') ?? []) as RawRecord[];
  const paginationRaw = (pick<RawRecord>(raw, 'pagination', 'pagination') ?? {}) as RawRecord;
  const quickActionsRaw = (pick<RawRecord>(raw, 'quickActions', 'quick_actions') ?? {}) as RawRecord;

  return {
    stats: normalizeStats(pick<RawRecord>(raw, 'stats', 'stats')),
    quickActions: {
      block: pickBool(quickActionsRaw, 'block', 'block'),
      suspend: pickBool(quickActionsRaw, 'suspend', 'suspend'),
      activate: pickBool(quickActionsRaw, 'activate', 'activate'),
      message:
        ADMIN_USER_MESSAGING_ENABLED && pickBool(quickActionsRaw, 'message', 'message'),
      clearSuspicion:
        pickBool(quickActionsRaw, 'clearSuspicion', 'clear_suspicion') ||
        pickBool(quickActionsRaw, 'clear_suspicion', 'clear_suspicion'),
    },
    users: users.map(normalizeUser),
    pagination: {
      page: Number(pick(paginationRaw, 'page', 'page') ?? 1) || 1,
      limit: Number(pick(paginationRaw, 'limit', 'limit') ?? 20) || 20,
      total: Number(pick(paginationRaw, 'total', 'total') ?? 0) || 0,
      totalPages:
        Number(
          pick(paginationRaw, 'totalPages', 'total_pages') ??
            pick(paginationRaw, 'total_pages', 'total_pages') ??
            1
        ) || 1,
      total_pages:
        Number(
          pick(paginationRaw, 'totalPages', 'total_pages') ??
            pick(paginationRaw, 'total_pages', 'total_pages') ??
            1
        ) || 1,
    },
    filters: normalizeFilters(pick<RawRecord>(raw, 'filters', 'filters')),
    generatedAt: pickString(raw, 'generatedAt', 'generated_at') ?? undefined,
  };
}
