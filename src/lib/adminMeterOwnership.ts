import { ADMIN_API_BASE, AuthApiError, clearAdminSession, redirectToSignIn } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  total?: number;
  error?: string;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
}

async function handle<T>(res: Response, fallback: string): Promise<ApiEnvelope<T>> {
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }
  if (!res.ok || body.success === false) {
    throw new AuthApiError(body.message || body.error || fallback, 'REQUEST_FAILED');
  }
  return body;
}

export async function listPrimaryMeterChangeRequests(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const res = await fetch(
    `${ADMIN_API_BASE}/primary-meter-change-requests?${q.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        Accept: 'application/json',
      },
    }
  );
  return handle<{ total?: number } & Record<string, unknown>>(res, 'Failed to list requests');
}

export async function updatePrimaryMeterChangeStatus(
  id: string,
  body: { status: string; admin_note?: string }
) {
  const res = await fetch(`${ADMIN_API_BASE}/primary-meter-change-requests/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handle(res, 'Failed to update request');
}

export async function listMeterOwnershipClaims(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const res = await fetch(`${ADMIN_API_BASE}/meter-ownership-claims?${q.toString()}`, {
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
      Accept: 'application/json',
    },
  });
  return handle(res, 'Failed to list claims');
}

export async function updateMeterOwnershipClaimStatus(
  id: string,
  body: { status: string; admin_note?: string }
) {
  const res = await fetch(`${ADMIN_API_BASE}/meter-ownership-claims/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handle(res, 'Failed to update claim');
}
