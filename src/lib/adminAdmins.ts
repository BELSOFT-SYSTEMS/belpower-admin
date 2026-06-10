import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import {
  normalizeAdminAccount,
  normalizeAdminActivityLogs,
  normalizeAdminsList,
  type AdminsListData,
} from '@/lib/normalizeAdminAccounts';
import type { AdminAccount, AdminFormValues, AdminLog } from '@/types/adminManagement';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  admin?: T;
  admins?: T;
  logs?: T;
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

  if (res.status === 404) {
    throw new AuthApiError(getErrorMessage(body, 'Not found'), 'NOT_FOUND');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, fallback), 'REQUEST_FAILED');
  }

  return body;
}

export type AdminsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function buildAdminsListQuery(params: AdminsListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  return query;
}

export async function getAdminsList(params: AdminsListParams = {}): Promise<AdminsListData> {
  const query = buildAdminsListQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/all?${query}`, {
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = await handleAdminResponse<Record<string, unknown>>(res, 'Failed to load admins');
  return normalizeAdminsList(body as unknown as Record<string, unknown>);
}

export async function getAdminDetail(adminId: string): Promise<AdminAccount> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/profile/${encodeURIComponent(adminId)}`, {
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = await handleAdminResponse<Record<string, unknown>>(res, 'Failed to load admin');
  const raw = (body.data ?? body.admin) as Record<string, unknown> | undefined;
  if (!raw) {
    throw new AuthApiError('Admin profile missing from response', 'REQUEST_FAILED');
  }
  return normalizeAdminAccount(raw);
}

export type AdminActivityLogsParams = {
  adminId: string;
  page?: number;
  limit?: number;
};

export async function getAdminActivityLogs(
  params: AdminActivityLogsParams
): Promise<{ logs: AdminLog[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
    admin_id: params.adminId,
  });

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/activity-logs?${query}`, {
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = await handleAdminResponse<Record<string, unknown>>(res, 'Failed to load activity logs');
  return normalizeAdminActivityLogs(body as unknown as Record<string, unknown>);
}

export type RegisterAdminPayload = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
};

export async function registerAdmin(payload: RegisterAdminPayload): Promise<AdminAccount> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/register`, {
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

  const body = await handleAdminResponse<Record<string, unknown>>(res, 'Failed to create admin');
  const raw = (body.admin ?? body.data) as Record<string, unknown> | undefined;
  if (!raw) {
    throw new AuthApiError('Created admin missing from response', 'REQUEST_FAILED');
  }
  return normalizeAdminAccount(raw);
}

export type UpdateAdminProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  status?: 'active' | 'suspended' | 'pending' | 'inactive';
  reason?: string;
};

export function formValuesToUpdatePayload(
  values: AdminFormValues,
  options?: { includeRole?: boolean }
): UpdateAdminProfilePayload {
  const payload: UpdateAdminProfilePayload = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone_number: values.phone.trim() || undefined,
  };

  if (options?.includeRole !== false) {
    payload.role = values.role;
  }

  return payload;
}

export function formValuesToRegisterPayload(values: AdminFormValues): RegisterAdminPayload {
  return {
    email: values.email.trim().toLowerCase(),
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    role: values.role,
    phone_number: values.phone.trim() || undefined,
  };
}

export async function updateAdminProfile(
  adminId: string,
  payload: UpdateAdminProfilePayload
): Promise<AdminAccount> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/profile/update/${encodeURIComponent(adminId)}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = await handleAdminResponse<Record<string, unknown>>(res, 'Failed to update admin');
  const raw = body.data as Record<string, unknown> | undefined;
  if (!raw) {
    throw new AuthApiError('Updated admin missing from response', 'REQUEST_FAILED');
  }
  return normalizeAdminAccount(raw);
}

export async function setAdminAccountStatus(
  adminId: string,
  status: 'active' | 'suspended'
): Promise<AdminAccount> {
  return updateAdminProfile(adminId, { status });
}

export async function deleteAdminAccount(adminId: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/profile/delete/${encodeURIComponent(adminId)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  await handleAdminResponse(res, 'Failed to delete admin');
}

export async function requestAdminPasswordReset(email: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/password-reset-request`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = await handleAdminResponse<{ message?: string }>(
    res,
    'Failed to send password reset'
  );
  return body.message ?? 'Password reset email sent';
}
