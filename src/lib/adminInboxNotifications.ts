import {
  ADMIN_API_BASE,
  AuthApiError,
  adminFetch,
  getStoredToken,
} from '@/lib/adminAuth';
import {
  normalizeAdminInboxData,
  unwrapAdminInboxPayload,
} from '@/lib/normalizeAdminInbox';
import type {
  AdminInboxData,
  AdminPushConfig,
} from '@/types/adminInboxNotifications';

const EMPTY_INBOX: AdminInboxData = {
  notifications: [],
  unread_count: 0,
  linked_user: true,
  pagination: {
    total: 0,
    page: 1,
    total_pages: 0,
    limit: 50,
  },
};

const DISABLED_PUSH_CONFIG: AdminPushConfig = {
  vapidPublicKey: null,
  webPushEnabled: false,
};

export type AdminInboxResult = {
  data: AdminInboxData;
  /** False only when the inbox endpoint is missing or unreachable (404/501/non-JSON). */
  apiAvailable: boolean;
};

type RawEnvelope = Record<string, unknown>;

async function parseAdminEnvelope(res: Response): Promise<{
  ok: boolean;
  payload?: unknown;
  unavailable?: boolean;
  unauthorized?: boolean;
}> {
  if (res.status === 401 || res.status === 403) {
    return { ok: false, unauthorized: true };
  }

  if (res.status === 404 || res.status === 501) {
    return { ok: false, unavailable: true };
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: false, unavailable: true };
  }

  try {
    const body = (await res.json()) as RawEnvelope;

    if (!res.ok || body.success === false) {
      if (res.status === 401 || res.status === 403) {
        return { ok: false, unauthorized: true };
      }
      return { ok: false, unavailable: res.status >= 500 };
    }

    const payload = unwrapAdminInboxPayload(body);
    if (!payload) {
      return { ok: false, unavailable: false };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, unavailable: true };
  }
}

async function fetchAdminInbox(path: string): Promise<AdminInboxResult> {
  const token = getStoredToken();
  if (!token) {
    return { data: EMPTY_INBOX, apiAvailable: false };
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const res = await fetch(`${ADMIN_API_BASE}${normalizedPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const parsed = await parseAdminEnvelope(res);
    if (parsed.unauthorized) {
      throw new AuthApiError('Session expired', 'UNAUTHORIZED');
    }

    if (parsed.ok && parsed.payload) {
      return {
        data: normalizeAdminInboxData(parsed.payload),
        apiAvailable: true,
      };
    }

    if (parsed.unavailable) {
      return { data: EMPTY_INBOX, apiAvailable: false };
    }

    return { data: EMPTY_INBOX, apiAvailable: false };
  } catch {
    return { data: EMPTY_INBOX, apiAvailable: false };
  }
}

export async function getAdminInbox(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminInboxResult> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.unreadOnly) search.set('unread_only', 'true');

  const query = search.toString();
  const path = `/notifications/inbox${query ? `?${query}` : ''}`;

  const result = await fetchAdminInbox(path);
  if (result.apiAvailable) {
    return result;
  }

  try {
    const data = await adminFetch<unknown>(path);
    return {
      data: normalizeAdminInboxData(data),
      apiAvailable: true,
    };
  } catch (err) {
    if (err instanceof AuthApiError) throw err;
    return { data: EMPTY_INBOX, apiAvailable: false };
  }
}

export async function markAdminInboxNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    await adminFetch(`/notifications/inbox/${notificationId}/read`, {
      method: 'PATCH',
    });
  } catch (err) {
    if (err instanceof AuthApiError) throw err;
  }
}

export async function markAllAdminInboxNotificationsRead(): Promise<void> {
  try {
    await adminFetch('/notifications/inbox/all/read', {
      method: 'PATCH',
    });
  } catch (err) {
    if (err instanceof AuthApiError) throw err;
  }
}

async function fetchOptionalAdminGet<T>(
  path: string,
  normalize: (payload: unknown) => T
): Promise<T | null> {
  const token = getStoredToken();
  if (!token) return null;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const res = await fetch(`${ADMIN_API_BASE}${normalizedPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const parsed = await parseAdminEnvelope(res);
    if (parsed.ok && parsed.payload) {
      return normalize(parsed.payload);
    }
  } catch {
    return null;
  }

  return null;
}

export async function getAdminPushConfig(): Promise<AdminPushConfig> {
  const data = await fetchOptionalAdminGet('/notifications/push/config', (payload) => {
    const raw = payload as Record<string, unknown>;
    return {
      vapidPublicKey:
        (raw.vapidPublicKey as string | null | undefined) ??
        (raw.vapid_public_key as string | null | undefined) ??
        null,
      webPushEnabled:
        Boolean(raw.webPushEnabled ?? raw.web_push_enabled ?? false),
    };
  });

  if (data) return data;
  return DISABLED_PUSH_CONFIG;
}

export async function registerAdminWebPush(
  subscription: PushSubscriptionJSON,
  deviceId?: string
): Promise<void> {
  try {
    await adminFetch('/notifications/push/register', {
      method: 'POST',
      body: JSON.stringify({
        token: subscription,
        device_id: deviceId,
      }),
    });
  } catch (err) {
    if (err instanceof AuthApiError) throw err;
  }
}
