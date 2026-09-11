import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type {
  BusinessDetail,
  BusinessesListData,
  BusinessesListParams,
  BusinessActionPayload,
} from '@/types/adminBusinesses';

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

async function businessRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/businesses${path}`, {
      ...init,
      headers: {
        ...adminHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired. Please sign in again.', 'UNAUTHORIZED');
  }

  const body = await parseApiResponse<T>(res);
  if (!res.ok || body.success === false) {
    throw new AuthApiError(
      getErrorMessage(body, `Request failed (${res.status})`),
      typeof body.error === 'string' ? body.error : body.error?.code
    );
  }

  return body.data as T;
}

export function buildBusinessesListQuery(params: BusinessesListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status && params.status !== '__all__') query.set('status', params.status);
  return query;
}

export function getBusinessesList(params: BusinessesListParams = {}) {
  const query = buildBusinessesListQuery(params);
  return businessRequest<BusinessesListData>(`?${query.toString()}`);
}

export function getBusinessDetail(businessId: string) {
  return businessRequest<BusinessDetail>(`/${encodeURIComponent(businessId)}`);
}

export async function blockBusiness(payload: BusinessActionPayload): Promise<unknown> {
  return businessRequest('/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function unblockBusiness(businessId: string): Promise<unknown> {
  return businessRequest('/unblock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId }),
  });
}

export async function deactivateBusiness(payload: BusinessActionPayload): Promise<unknown> {
  return businessRequest('/deactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
