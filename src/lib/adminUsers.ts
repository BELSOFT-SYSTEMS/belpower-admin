import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import { normalizeAdminUserDetail } from '@/lib/normalizeAdminUserDetail';
import { normalizeUsersList } from '@/lib/normalizeUsersList';
import type {
  AdminUserDetail,
  ClearUserSuspicionResult,
} from '@/types/adminUserDetail';
import type { UsersListData, UsersListParams } from '@/types/adminUsers';
import {
  devLogUserDetailActivityResponse,
  devLogUsersListActivityResponse,
} from '@/utils/logUserActivityFields';

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

export function buildUsersListQuery(params: UsersListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    sort: params.sort ?? 'lastActiveAt:desc',
  });

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.suspicious) {
    query.set('suspicious', 'true');
  } else if (params.status) {
    query.set('status', params.status);
  }

  if (params.includeStats === false) {
    query.set('includeStats', 'false');
  }

  if (params.includeDeleted) {
    query.set('includeDeleted', 'true');
  }

  return query;
}

export async function getUsersList(params: UsersListParams): Promise<UsersListData> {
  const query = buildUsersListQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/users?${query}`, {
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

  if (res.status === 403) {
    throw new AuthApiError(
      getErrorMessage(body, 'You do not have access to users'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(getErrorMessage(body, 'Failed to load users'), 'REQUEST_FAILED');
  }

  devLogUsersListActivityResponse(body.data);

  return normalizeUsersList(body.data);
}

async function postUserAction<T = unknown>(
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}${path}`, {
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

  const body = (await res.json()) as ApiEnvelope<T>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (res.status === 403) {
    throw new AuthApiError(
      getErrorMessage(body, 'You do not have permission for this action'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, 'Action failed'), 'REQUEST_FAILED');
  }

  return body.data as T;
}

export async function blockUser(userId: string, reason?: string): Promise<void> {
  await postUserAction('/users/block', {
    userId,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}

export async function suspendUser(
  userId: string,
  options?: { reason?: string; days?: number }
): Promise<void> {
  await postUserAction('/users/suspend', {
    userId,
    ...(options?.reason?.trim() ? { reason: options.reason.trim() } : {}),
    ...(options?.days ? { days: options.days } : {}),
  });
}

export async function activateUser(userId: string): Promise<void> {
  await postUserAction('/users/activate', { userId });
}

export async function deleteUser(userId: string): Promise<void> {
  await postUserAction('/users/delete', { userId, confirm: true });
}

export async function clearUserSuspicion(
  userId: string,
  reason?: string
): Promise<ClearUserSuspicionResult> {
  return postUserAction('/users/clear-suspicion', {
    userId,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/users/${encodeURIComponent(userId)}`, {
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

  if (res.status === 403) {
    throw new AuthApiError(
      getErrorMessage(body, 'You do not have access to this user'),
      'FORBIDDEN'
    );
  }

  if (res.status === 404) {
    throw new AuthApiError(getErrorMessage(body, 'User not found'), 'NOT_FOUND');
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(getErrorMessage(body, 'Failed to load user'), 'REQUEST_FAILED');
  }

  devLogUserDetailActivityResponse(body.data);

  return normalizeAdminUserDetail(body.data);
}
