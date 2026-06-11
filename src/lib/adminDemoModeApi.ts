import {
  ADMIN_API_BASE,
  AuthApiError,
  adminHeaders,
  clearAdminSession,
  getStoredToken,
  redirectToSignIn,
} from '@/lib/adminAuth';

export type DemoModeState = {
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string | null;
};

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

function normalizeDemoModeState(raw: Record<string, unknown> | undefined): DemoModeState {
  return {
    enabled: Boolean(raw?.enabled),
    updatedAt:
      typeof raw?.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    updatedBy: typeof raw?.updatedBy === 'string' ? raw.updatedBy : null,
  };
}

/** True when the backend has not shipped the demo-mode endpoint yet. */
export function isDemoModeBackendMissing(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === 'NOT_FOUND';
}

export async function getBackendDemoModeState(): Promise<DemoModeState> {
  const res = await fetch(`${ADMIN_API_BASE}/system/demo-mode`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });

  if (res.status === 404) {
    throw new AuthApiError('Demo mode endpoint not found', 'NOT_FOUND');
  }

  const body = await handleAdminResponse<{ demoMode?: Record<string, unknown> }>(
    res,
    'Failed to load demo mode'
  );

  return normalizeDemoModeState(body.data?.demoMode);
}

export async function patchBackendDemoModeState(enabled: boolean): Promise<DemoModeState> {
  const res = await fetch(`${ADMIN_API_BASE}/system/demo-mode`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ enabled }),
  });

  if (res.status === 404) {
    throw new AuthApiError('Demo mode endpoint not found', 'NOT_FOUND');
  }

  const body = await handleAdminResponse<{ state?: Record<string, unknown> }>(
    res,
    'Failed to update demo mode'
  );

  return normalizeDemoModeState(body.data?.state);
}

export function hasDemoModeAuthToken(): boolean {
  return Boolean(getStoredToken());
}
