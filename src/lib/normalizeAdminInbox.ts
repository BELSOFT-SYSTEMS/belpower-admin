import type {
  AdminInboxData,
  AdminInboxNotification,
} from '@/types/adminInboxNotifications';

type RawRecord = Record<string, unknown>;

function pick<T>(raw: RawRecord, camel: string, snake: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

function pickString(raw: RawRecord, camel: string, snake: string): string {
  const value = pick<string>(raw, camel, snake);
  return value !== undefined && value !== null ? String(value) : '';
}

function pickBool(raw: RawRecord, camel: string, snake: string, fallback = false): boolean {
  const value = pick<boolean>(raw, camel, snake);
  return typeof value === 'boolean' ? value : fallback;
}

function pickNumber(raw: RawRecord, camel: string, snake: string, fallback = 0): number {
  const value = pick<number | string>(raw, camel, snake);
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeNotification(raw: RawRecord): AdminInboxNotification {
  return {
    id: pickString(raw, 'id', 'id'),
    title: pickString(raw, 'title', 'title'),
    message: pickString(raw, 'message', 'message'),
    type: pickString(raw, 'type', 'type') || 'system',
    priority: (pick(raw, 'priority', 'priority') ?? 'low') as AdminInboxNotification['priority'],
    is_read: pickBool(raw, 'isRead', 'is_read'),
    action_url: pickString(raw, 'actionUrl', 'action_url') || null,
    metadata: (pick(raw, 'metadata', 'metadata') ?? undefined) as
      | Record<string, unknown>
      | undefined,
    created_at: pickString(raw, 'createdAt', 'created_at'),
    updated_at: pickString(raw, 'updatedAt', 'updated_at') || undefined,
    read_at: pickString(raw, 'readAt', 'read_at') || null,
  };
}

export function normalizeAdminInboxData(raw: unknown): AdminInboxData {
  const source = (raw ?? {}) as RawRecord;
  const paginationRaw = (pick<RawRecord>(source, 'pagination', 'pagination') ??
    {}) as RawRecord;
  const notificationsRaw = pick<unknown[]>(source, 'notifications', 'notifications') ?? [];

  return {
    notifications: notificationsRaw
      .filter((item): item is RawRecord => Boolean(item) && typeof item === 'object')
      .map((item) => normalizeNotification(item)),
    unread_count: pickNumber(source, 'unreadCount', 'unread_count'),
    linked_user: pickBool(source, 'linkedUser', 'linked_user', true),
    pagination: {
      total: pickNumber(paginationRaw, 'total', 'total'),
      page: pickNumber(paginationRaw, 'page', 'page', 1),
      total_pages: pickNumber(paginationRaw, 'totalPages', 'total_pages'),
      limit: pickNumber(paginationRaw, 'limit', 'limit', 50),
    },
  };
}

export function unwrapAdminInboxPayload(body: RawRecord): unknown {
  if (body.data !== undefined && body.data !== null) {
    return body.data;
  }
  if (Array.isArray(body.notifications)) {
    return body;
  }
  return null;
}
