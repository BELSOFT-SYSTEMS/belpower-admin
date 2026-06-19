import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import {
  normalizeFraudEvent,
  normalizeFraudEventsList,
  normalizeFraudEventStats,
} from '@/lib/normalizeFraudEvents';
import type {
  FraudEvent,
  FraudEventStats,
  FraudEventsListData,
  FraudEventsListParams,
  ReviewFraudEventPayload,
  FraudScanResult,
} from '@/types/adminFraud';

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

export function buildFraudEventsQuery(params: FraudEventsListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.severity) query.set('severity', params.severity);
  if (params.reviewStatus) query.set('reviewStatus', params.reviewStatus);
  if (params.userId?.trim()) query.set('userId', params.userId.trim());
  if (params.code?.trim()) query.set('code', params.code.trim());
  if (params.internalTest) query.set('internalTest', params.internalTest);

  return query;
}

async function handleResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<Record<string, unknown>>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, fallback), 'API_ERROR');
  }

  return body.data as T;
}

export async function getFraudEventStats(): Promise<FraudEventStats> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events/stats`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to fetch fraud stats');
  return normalizeFraudEventStats(data);
}

export async function getFraudEventsList(
  params: FraudEventsListParams = {}
): Promise<FraudEventsListData> {
  const query = buildFraudEventsQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events?${query}`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to fetch fraud events');
  return normalizeFraudEventsList(data);
}

export async function getFraudEventById(eventId: string): Promise<FraudEvent> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events/${eventId}`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to fetch fraud event');
  return normalizeFraudEvent(data);
}

export async function reviewFraudEvent(
  eventId: string,
  payload: ReviewFraudEventPayload
): Promise<FraudEvent> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events/${eventId}/review`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to update fraud event');
  return normalizeFraudEvent(data);
}

export async function runFraudScan(): Promise<FraudScanResult> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events/run-scan`, {
      method: 'POST',
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = (await res.json()) as ApiEnvelope<Record<string, unknown>>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, 'Failed to run fraud scan'), 'API_ERROR');
  }

  const data = (body.data ?? {}) as Record<string, unknown>;
  return {
    startedAt: String(data.startedAt ?? data.started_at ?? ''),
    finishedAt: String(data.finishedAt ?? data.finished_at ?? ''),
    created: Number(data.created ?? 0),
    skipped: Number(data.skipped ?? 0),
    errors: Array.isArray(data.errors) ? (data.errors as FraudScanResult['errors']) : [],
  };
}
