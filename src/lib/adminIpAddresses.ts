import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import {
  normalizeIpAddressLookup,
  normalizeIpAddressesList,
  normalizeIpAddressStats,
} from '@/lib/normalizeIpAddresses';
import type {
  IpAddressActionPayload,
  IpAddressLookup,
  IpAddressesListData,
  IpAddressesListParams,
  IpAddressStats,
} from '@/types/adminIpAddresses';

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

export function buildIpAddressesQuery(params: IpAddressesListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.category) query.set('category', params.category);
  if (params.search?.trim()) query.set('search', params.search.trim());

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

async function postAction(path: string, payload: IpAddressActionPayload) {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/ip-addresses/${path}`, {
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

  return handleResponse<Record<string, unknown>>(res, `Failed to ${path.replace('-', ' ')} IP address`);
}

export async function getIpAddressStats(): Promise<IpAddressStats> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/ip-addresses/stats`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to fetch IP stats');
  return normalizeIpAddressStats(data);
}

export async function getIpAddressesList(
  params: IpAddressesListParams = {}
): Promise<IpAddressesListData> {
  const query = buildIpAddressesQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/ip-addresses?${query}`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to fetch IP addresses');
  return normalizeIpAddressesList(data);
}

export async function lookupIpAddress(ipAddress: string): Promise<IpAddressLookup> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/ip-addresses/lookup/${encodeURIComponent(ipAddress)}`, {
      headers: adminHeaders(),
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const data = await handleResponse<Record<string, unknown>>(res, 'Failed to lookup IP address');
  return normalizeIpAddressLookup(data);
}

export async function blockIpAddress(payload: IpAddressActionPayload) {
  return postAction('block', payload);
}

export async function banIpAddressForever(payload: IpAddressActionPayload) {
  return postAction('ban-forever', payload);
}

export async function unblockIpAddress(payload: IpAddressActionPayload) {
  return postAction('unblock', payload);
}

export async function whitelistIpAddress(payload: IpAddressActionPayload) {
  return postAction('whitelist', payload);
}

export async function removeIpWhitelist(payload: IpAddressActionPayload) {
  return postAction('remove-whitelist', payload);
}
