import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import {
  normalizeAdminSchedule,
  normalizeScheduleHistory,
  normalizeSchedulesList,
} from '@/lib/normalizeAdminSchedules';
import type {
  AdminBillSchedule,
  ScheduleHistoryItem,
  SchedulesListData,
  SchedulesListParams,
} from '@/types/adminSchedules';

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

async function parseApiResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<ApiEnvelope<T>>;
  }
  const text = (await res.text()).trim();
  return {
    success: false,
    message: text || `Request failed (${res.status})`,
    error: 'REQUEST_FAILED',
  };
}

async function scheduleRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_API_BASE}/${path}`, {
    ...init,
    headers: {
      ...adminHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired');
  }

  const body = await parseApiResponse<T>(res);
  if (!res.ok || body.success === false) {
    throw new Error(getErrorMessage(body, `Request failed (${res.status})`));
  }

  return body.data as T;
}

export function buildSchedulesListQuery(params: SchedulesListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status) query.set('status', params.status);
  if (params.serviceType) query.set('service_type', params.serviceType);
  if (params.userId?.trim()) query.set('userId', params.userId.trim());

  return query;
}

export async function getSchedulesList(params: SchedulesListParams): Promise<SchedulesListData> {
  const query = buildSchedulesListQuery(params);
  const data = await scheduleRequest<{
    schedules?: Array<Record<string, unknown>>;
    pagination?: {
      total?: number;
      page?: number;
      limit?: number;
      total_pages?: number;
    };
  }>(`schedules?${query.toString()}`);

  return normalizeSchedulesList(
    data as Parameters<typeof normalizeSchedulesList>[0]
  );
}

export async function getScheduleDetail(scheduleId: string): Promise<AdminBillSchedule> {
  const data = await scheduleRequest<{ schedule?: Record<string, unknown> }>(
    `schedules/${scheduleId}`
  );
  return normalizeAdminSchedule((data.schedule ?? {}) as Parameters<typeof normalizeAdminSchedule>[0]);
}

export async function getScheduleHistory(scheduleId: string): Promise<ScheduleHistoryItem[]> {
  const data = await scheduleRequest<{ history?: Array<Record<string, unknown>> }>(
    `schedules/${scheduleId}/history`
  );
  return normalizeScheduleHistory((data.history ?? []) as Parameters<typeof normalizeScheduleHistory>[0]);
}

export async function pauseAdminSchedule(scheduleId: string): Promise<AdminBillSchedule> {
  const data = await scheduleRequest<{ schedule?: Record<string, unknown> }>(
    `schedules/${scheduleId}/pause`,
    { method: 'PATCH' }
  );
  return normalizeAdminSchedule((data.schedule ?? {}) as Parameters<typeof normalizeAdminSchedule>[0]);
}

export async function resumeAdminSchedule(scheduleId: string): Promise<AdminBillSchedule> {
  const data = await scheduleRequest<{ schedule?: Record<string, unknown> }>(
    `schedules/${scheduleId}/resume`,
    { method: 'PATCH' }
  );
  return normalizeAdminSchedule((data.schedule ?? {}) as Parameters<typeof normalizeAdminSchedule>[0]);
}

export async function cancelAdminSchedule(scheduleId: string): Promise<void> {
  await scheduleRequest(`schedules/${scheduleId}`, { method: 'DELETE' });
}
