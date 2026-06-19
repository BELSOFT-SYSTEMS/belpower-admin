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
  BulkReviewFraudEventsPayload,
  BulkReviewFraudEventsResult,
  FraudScanResult,
  FraudScanStepResult,
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

export async function bulkReviewFraudEvents(
  payload: BulkReviewFraudEventsPayload
): Promise<BulkReviewFraudEventsResult> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events/bulk-review`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to update fraud events');
  const failedRaw = Array.isArray(data.failed) ? data.failed : [];

  return {
    updated: Number(data.updated ?? 0),
    updatedIds: Array.isArray(data.updatedIds)
      ? (data.updatedIds as string[])
      : Array.isArray(data.updated_ids)
        ? (data.updated_ids as string[])
        : [],
    failed: failedRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? ''),
        reason: String(row.reason ?? 'unknown'),
      };
    }),
  };
}

function normalizeFraudScanStepResult(raw: Record<string, unknown>): FraudScanStepResult {
  return {
    checkId: String(raw.checkId ?? raw.check_id ?? ''),
    label: String(raw.label ?? ''),
    found: Number(raw.found ?? 0),
    created: Number(raw.created ?? 0),
    skipped: Number(raw.skipped ?? 0),
  };
}

function normalizeFraudScanResult(raw: Record<string, unknown>): FraudScanResult {
  const checksRaw = (raw.checks ?? {}) as Record<string, Record<string, unknown>>;
  const checks = Object.fromEntries(
    Object.entries(checksRaw).map(([key, value]) => [key, normalizeFraudScanStepResult(value)])
  );

  return {
    startedAt: String(raw.startedAt ?? raw.started_at ?? ''),
    finishedAt: String(raw.finishedAt ?? raw.finished_at ?? ''),
    created: Number(raw.created ?? 0),
    skipped: Number(raw.skipped ?? 0),
    errors: Array.isArray(raw.errors) ? (raw.errors as FraudScanResult['errors']) : [],
    checks: Object.keys(checks).length > 0 ? checks : undefined,
  };
}

async function postFraudScan(path: string): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/fraud-events${path}`, {
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

  return (body.data ?? {}) as Record<string, unknown>;
}

export async function beginFraudScan(): Promise<{ startedAt: string }> {
  const data = await postFraudScan('/run-scan/begin');
  return { startedAt: String(data.startedAt ?? data.started_at ?? '') };
}

export async function runFraudScanCheck(checkId: string): Promise<FraudScanStepResult> {
  const data = await postFraudScan(`/run-scan/checks/${encodeURIComponent(checkId)}`);
  return normalizeFraudScanStepResult(data);
}

export async function finishFraudScan(): Promise<FraudScanResult> {
  const data = await postFraudScan('/run-scan/finish');
  return normalizeFraudScanResult(data);
}

export async function cancelFraudScan(): Promise<void> {
  await postFraudScan('/run-scan/cancel');
}

export async function runFraudScan(): Promise<FraudScanResult> {
  const data = await postFraudScan('/run-scan');
  return normalizeFraudScanResult(data);
}
