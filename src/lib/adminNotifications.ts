import {
  ADMIN_API_BASE,
  AuthApiError,
  adminFetch,
  adminHeaders,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import {
  normalizeAudienceOptions,
  normalizeNotificationStats,
  normalizeNotificationTemplate,
  normalizeSentNotification,
  type AudienceOptionsData,
} from '@/lib/normalizeAdminNotifications';
import type {
  NotificationProviderOption,
  NotificationStats,
  NotificationTemplate,
  SendNotificationPayload,
  SentNotification,
} from '@/types/adminNotifications';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string | { message?: string; code?: string };
};

function getErrorMessage(body: ApiEnvelope<unknown>, fallback: string): string {
  if (typeof body.error === 'string') return body.error;
  if (body.error && typeof body.error === 'object' && body.error.message) {
    return body.error.message;
  }
  return body.message ?? fallback;
}

async function handleAdminResponse<T>(
  res: Response,
  fallback: string
): Promise<ApiEnvelope<T>> {
  const body = (await res.json()) as ApiEnvelope<T>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (res.status === 403) {
    throw new AuthApiError(getErrorMessage(body, 'You do not have permission'), 'FORBIDDEN');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, fallback), 'REQUEST_FAILED');
  }

  return body;
}

export type NotificationUserOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type AudienceEstimate = {
  count: number;
  label: string;
};

export type NotificationHistoryData = {
  scope: 'mine' | 'all';
  can_view_all: boolean;
  history: SentNotification[];
  pagination: {
    total: number;
    page: number;
    total_pages: number;
    limit: number;
  };
};

export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  const res = await fetch(`${ADMIN_API_BASE}/notifications/templates`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<{ templates?: unknown[] }>(
    res,
    'Failed to load notification templates'
  );
  const templates = body.data?.templates ?? [];
  return templates.map((item) =>
    normalizeNotificationTemplate(item as Record<string, unknown>)
  );
}

export async function getAudienceOptions(): Promise<AudienceOptionsData> {
  const res = await fetch(`${ADMIN_API_BASE}/notifications/audience/options`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<Record<string, unknown>>(
    res,
    'Failed to load audience options'
  );
  return normalizeAudienceOptions(body.data ?? {});
}

export async function estimateNotificationAudience(
  payload: SendNotificationPayload
): Promise<AudienceEstimate> {
  const res = await fetch(`${ADMIN_API_BASE}/notifications/estimate`, {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      audience: payload.audience,
      states: payload.states,
      providers: payload.providers ?? payload.discos,
      user_id: payload.user_id,
    }),
  });
  const body = await handleAdminResponse<AudienceEstimate>(
    res,
    'Failed to estimate audience'
  );
  return {
    count: Number(body.data?.count ?? 0),
    label: String(body.data?.label ?? 'No audience selected'),
  };
}

export type CampaignPushStats = {
  attempted: number;
  delivered: number;
  skipped_no_tokens: number;
  failed: number;
};

export async function sendNotificationCampaign(
  payload: SendNotificationPayload
): Promise<{
  broadcast: SentNotification;
  notifications_sent: number;
  push: CampaignPushStats | null;
  message: string;
}> {
  const res = await fetch(`${ADMIN_API_BASE}/notifications/campaign`, {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      template_id: payload.template_id,
      audience: payload.audience,
      states: payload.states,
      providers: payload.providers ?? payload.discos,
      user_id: payload.user_id,
    }),
  });
  const body = await handleAdminResponse<{
    broadcast?: Record<string, unknown>;
    notifications_sent?: number;
    push?: CampaignPushStats | null;
  }>(res, 'Failed to send notification');

  const broadcastRaw = body.data?.broadcast ?? {};
  return {
    broadcast: normalizeSentNotification({
      ...broadcastRaw,
      sent_by: 'You',
    }),
    notifications_sent: Number(body.data?.notifications_sent ?? 0),
    push: body.data?.push ?? null,
    message: body.message ?? 'Notification sent',
  };
}

export async function getNotificationHistory(params: {
  page?: number;
  limit?: number;
  scope?: 'mine' | 'all';
} = {}): Promise<NotificationHistoryData> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    scope: params.scope ?? 'mine',
  });

  const res = await fetch(`${ADMIN_API_BASE}/notifications/history?${query}`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<{
    scope?: 'mine' | 'all';
    can_view_all?: boolean;
    history?: unknown[];
    pagination?: NotificationHistoryData['pagination'];
  }>(res, 'Failed to load notification history');

  const history = (body.data?.history ?? []).map((item) =>
    normalizeSentNotification(item as Record<string, unknown>)
  );

  return {
    scope: body.data?.scope ?? 'mine',
    can_view_all: Boolean(body.data?.can_view_all),
    history,
    pagination: body.data?.pagination ?? {
      total: history.length,
      page: 1,
      total_pages: 1,
      limit: 20,
    },
  };
}

export async function getNotificationStats(
  scope: 'mine' | 'all' = 'mine'
): Promise<NotificationStats> {
  const res = await fetch(`${ADMIN_API_BASE}/notifications/stats?scope=${scope}`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<Record<string, unknown>>(
    res,
    'Failed to load notification stats'
  );
  return normalizeNotificationStats(body.data ?? {});
}

export async function searchNotificationUsers(
  search: string,
  limit = 20
): Promise<NotificationUserOption[]> {
  const query = new URLSearchParams({
    page: '1',
    limit: String(limit),
  });
  if (search.trim()) {
    query.set('search', search.trim());
  }

  const res = await fetch(`${ADMIN_API_BASE}/notifications/users?${query}`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<{ users?: Record<string, unknown>[] }>(
    res,
    'Failed to search users'
  );

  return (body.data?.users ?? []).map((user) => ({
    id: String(user.id ?? ''),
    first_name: String(user.first_name ?? ''),
    last_name: String(user.last_name ?? ''),
    email: String(user.email ?? ''),
  }));
}

export function buildProviderDropdownOptions(providers: NotificationProviderOption[]) {
  return providers.map((provider) => ({
    value: provider.code,
    label: provider.label,
  }));
}
