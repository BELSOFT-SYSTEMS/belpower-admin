import type {
  AdminProfile,
  ApiErrorPayload,
  LoginResult,
  LoginSuccessData,
} from '@/types/adminAuth';

/** Browser calls go through the Next.js proxy to avoid CORS. */
export const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? '/api/admin-proxy';

export const ADMIN_TOKEN_KEY = 'adminToken';
export const ADMIN_PROFILE_KEY = 'admin';

export class AuthApiError extends Error {
  code?: string;
  attempts?: number;

  constructor(message: string, code?: string, attempts?: number) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.attempts = attempts;
  }
}

export class SetupRequiredError extends Error {
  email: string;

  constructor(message: string, email: string) {
    super(message);
    this.name = 'SetupRequiredError';
    this.email = email;
  }
}

export class AccountInactiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountInactiveError';
  }
}

type ApiEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  requiresOTP?: boolean;
  data?: T;
  error?: string | ApiErrorPayload;
  code?: string;
  attempts?: number;
};

function getErrorPayload(body: ApiEnvelope): ApiErrorPayload {
  if (typeof body.error === 'string') {
    return { message: body.error, code: body.code, attempts: body.attempts };
  }
  if (body.error && typeof body.error === 'object') {
    return body.error;
  }
  return { message: body.message };
}

function parseLoginError(body: ApiEnvelope, status: number): Error {
  const err = getErrorPayload(body);

  if (err.details?.requiresSetup) {
    return new SetupRequiredError(
      err.message ?? 'Please complete your account setup using the link sent to your email',
      err.details.email ?? ''
    );
  }

  if (err.code === 'ACCOUNT_INACTIVE') {
    return new AccountInactiveError(
      err.message ??
        'Your account is inactive. Please contact support to activate your account.'
    );
  }

  return new AuthApiError(
    err.message ?? 'Login failed. Please try again.',
    err.code ?? (status === 401 ? 'INVALID_CREDENTIALS' : undefined)
  );
}

function parseOtpError(body: ApiEnvelope): AuthApiError {
  const err = getErrorPayload(body);
  const message =
    (typeof body.error === 'string' ? body.error : err.message) ??
    'Invalid or expired OTP. Please try again.';
  const code = body.code ?? err.code ?? 'OTP_INVALID';
  const attempts = body.attempts ?? err.attempts;
  return new AuthApiError(message, code, attempts);
}

export function normalizeProfile(profile: AdminProfile): AdminProfile {
  return {
    ...profile,
    allAccess: profile.allAccess ?? profile.role === 'super_admin',
    permissions: profile.permissions ?? [],
  };
}

export function isValidAdminToken(token: string | null | undefined): token is string {
  return !!token && token !== 'undefined' && token !== 'null';
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return isValidAdminToken(token) ? token : null;
}

export function getStoredAdmin(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!raw) return null;
  try {
    return normalizeProfile(JSON.parse(raw) as AdminProfile);
  } catch {
    return null;
  }
}

export function saveLoginResult(data: LoginSuccessData): AdminProfile {
  if (!isValidAdminToken(data.token)) {
    throw new AuthApiError('Login response missing a valid token.');
  }

  const profile = normalizeProfile((data.user ?? data.admin)!);
  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
}

export function redirectToSignIn(from?: string | null): void {
  const path =
    from && from !== '/command-center/sign-in'
      ? `/command-center/sign-in?from=${encodeURIComponent(from)}`
      : '/command-center/sign-in';
  window.location.href = path;
}

export function adminHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

const PUBLIC_ADMIN_PATHS = new Set([
  '/login',
  '/login/verify-otp',
  '/complete-setup',
  '/reset-password',
]);

function isPublicAdminRequest(path: string): boolean {
  const normalized = path.startsWith('/') ? path.split('?')[0] : `/${path.split('?')[0]}`;
  return (
    PUBLIC_ADMIN_PATHS.has(normalized) ||
    normalized.startsWith('/login/') ||
    normalized.startsWith('/reset-password')
  );
}

export function canAccess(admin: AdminProfile | null, permissionKey: string): boolean {
  if (!admin) return false;
  if (admin.allAccess) return true;
  return admin.permissions.includes(permissionKey);
}

async function parseJsonResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  return res.json() as Promise<ApiEnvelope<T>>;
}

async function adminRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const token = getStoredToken();
  const requiresAuth = !isPublicAdminRequest(normalizedPath);

  if (requiresAuth && !token) {
    throw new AuthApiError('Admin token required', 'UNAUTHORIZED');
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    return await fetch(`${ADMIN_API_BASE}${normalizedPath}`, {
      ...options,
      headers,
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }
}

export async function adminLogin(email: string, password: string): Promise<LoginResult> {
  const res = await adminRequest('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await parseJsonResponse<LoginSuccessData & { email: string; expiresAt: string; adminId?: string }>(res);

  if (!res.ok || body.success === false) {
    throw parseLoginError(body, res.status);
  }

  if (body.requiresOTP && body.data) {
    return {
      step: 'otp',
      email: body.data.email,
      expiresAt: body.data.expiresAt,
      adminId: body.data.adminId,
    };
  }

  if (!body.data?.token) {
    throw new AuthApiError('Login response missing token.');
  }

  const profile = normalizeProfile((body.data.user ?? body.data.admin)!);
  return { step: 'done', token: body.data.token, profile };
}

export async function adminVerifyOtp(email: string, otp: string): Promise<AdminProfile> {
  const res = await adminRequest('/login/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const body = await parseJsonResponse<LoginSuccessData>(res);

  if (!res.ok || body.success === false) {
    throw parseOtpError(body);
  }

  if (!body.data?.token) {
    throw new AuthApiError('OTP verification response missing token.');
  }

  return saveLoginResult(body.data);
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const token = getStoredToken();
  if (!token) {
    throw new AuthApiError('Not authenticated', 'UNAUTHORIZED');
  }

  const res = await adminRequest('/profile/me', {
    method: 'GET',
    headers: adminHeaders(),
  });

  const body = await parseJsonResponse<AdminProfile | { admin: AdminProfile }>(res);

  if (!res.ok || body.success === false) {
    throw new AuthApiError(
      getErrorPayload(body).message ?? 'Session expired',
      'UNAUTHORIZED'
    );
  }

  const raw = (body.data as { admin?: AdminProfile })?.admin ?? (body.data as AdminProfile);
  const profile = normalizeProfile(raw);
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await adminRequest(path, options);

  const body = await parseJsonResponse<T>(res);

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (!res.ok || body.success === false) {
    const err = getErrorPayload(body);
    throw new AuthApiError(err.message ?? 'Request failed', err.code);
  }

  return body.data as T;
}

export async function completeAccountSetup(payload: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<string> {
  const res = await adminRequest('/complete-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse<{ email?: string }>(res);

  if (!res.ok || body.success === false) {
    const err = getErrorPayload(body);
    throw new AuthApiError(err.message ?? 'Account setup failed', err.code);
  }

  return body.data?.email ?? '';
}
