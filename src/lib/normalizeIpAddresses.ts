import type {
  IpAddressRecord,
  IpAddressStats,
  IpAddressesListData,
  IpAddressLookup,
} from '@/types/adminIpAddresses';

function readString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeIpAddressRecord(raw: Record<string, unknown>): IpAddressRecord {
  return {
    id: readString(raw.id) || '',
    ipAddress: readString(raw.ipAddress ?? raw.ip_address) || '',
    recordType: (readString(raw.recordType ?? raw.record_type) as IpAddressRecord['recordType']) || 'block',
    status: (readString(raw.status) as IpAddressRecord['status']) || 'blocked',
    reason: readString(raw.reason),
    description: readString(raw.description),
    offenseCount: readNumber(raw.offenseCount ?? raw.offense_count, 0),
    isPermanent: Boolean(raw.isPermanent ?? raw.is_permanent),
    expiresAt: readString(raw.expiresAt ?? raw.expires_at),
    source: (readString(raw.source) as IpAddressRecord['source']) || null,
    adminId: readString(raw.adminId ?? raw.admin_id),
    createdByAdminId: readString(raw.createdByAdminId ?? raw.created_by_admin_id ?? raw.created_by),
    createdByAdminEmail: readString(raw.createdByAdminEmail ?? raw.created_by_admin_email),
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? (raw.metadata as Record<string, unknown>)
        : {},
    createdAt: readString(raw.createdAt ?? raw.created_at) || '',
    updatedAt: readString(raw.updatedAt ?? raw.updated_at) || undefined,
  };
}

export function normalizeIpAddressStats(raw: Record<string, unknown>): IpAddressStats {
  return {
    activeBlockedCount: readNumber(raw.activeBlockedCount ?? raw.active_blocked_count, 0),
    permanentBannedCount: readNumber(raw.permanentBannedCount ?? raw.permanent_banned_count, 0),
    blacklistedCount: readNumber(raw.blacklistedCount ?? raw.blacklisted_count, 0),
    whitelistedCount: readNumber(raw.whitelistedCount ?? raw.whitelisted_count, 0),
    autoBlocked24h: readNumber(raw.autoBlocked24h ?? raw.auto_blocked_24h, 0),
    expiring24h: readNumber(raw.expiring24h ?? raw.expiring_24h, 0),
  };
}

export function normalizeIpAddressesList(raw: Record<string, unknown>): IpAddressesListData {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const paginationRaw =
    raw.pagination && typeof raw.pagination === 'object'
      ? (raw.pagination as Record<string, unknown>)
      : {};

  return {
    items: itemsRaw.map((item) =>
      normalizeIpAddressRecord(item as Record<string, unknown>)
    ),
    pagination: {
      page: readNumber(paginationRaw.page, 1),
      limit: readNumber(paginationRaw.limit, 20),
      total: readNumber(paginationRaw.total, itemsRaw.length),
      totalPages: readNumber(paginationRaw.totalPages ?? paginationRaw.total_pages, 1),
    },
  };
}

export function normalizeIpAddressLookup(raw: Record<string, unknown>): IpAddressLookup {
  return {
    ipAddress: readString(raw.ipAddress ?? raw.ip_address) || '',
    isWhitelisted: Boolean(raw.isWhitelisted ?? raw.is_whitelisted),
    whitelist: raw.whitelist
      ? normalizeIpAddressRecord(raw.whitelist as Record<string, unknown>)
      : null,
    activeBlock: raw.activeBlock
      ? normalizeIpAddressRecord(raw.activeBlock as Record<string, unknown>)
      : raw.active_block
        ? normalizeIpAddressRecord(raw.active_block as Record<string, unknown>)
        : null,
  };
}
