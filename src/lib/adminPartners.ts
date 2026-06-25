import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type {
  PartnerActionPayload,
  PartnerDetail,
  PartnersListData,
  PartnersListParams,
} from '@/types/adminPartners';

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

async function partnerRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${ADMIN_API_BASE}/partners${path}`, {
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

export function buildPartnersListQuery(params: PartnersListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.status && params.status !== '__all__') {
    query.set('status', params.status);
  }

  return query;
}

export async function getPartnersList(
  params: PartnersListParams
): Promise<PartnersListData> {
  const query = buildPartnersListQuery(params);
  return partnerRequest<PartnersListData>(`?${query}`);
}

export async function getPartnerDetail(partnerId: string): Promise<PartnerDetail> {
  return partnerRequest<PartnerDetail>(`/${encodeURIComponent(partnerId)}`);
}

export async function approvePartner(payload: PartnerActionPayload): Promise<unknown> {
  return partnerRequest('/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function rejectPartner(payload: PartnerActionPayload): Promise<unknown> {
  return partnerRequest('/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function blockPartner(payload: PartnerActionPayload): Promise<unknown> {
  return partnerRequest('/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function unblockPartner(partnerId: string): Promise<unknown> {
  return partnerRequest('/unblock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partnerId }),
  });
}

export async function deactivatePartner(payload: PartnerActionPayload): Promise<unknown> {
  return partnerRequest('/deactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
