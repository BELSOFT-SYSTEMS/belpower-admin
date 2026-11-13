import {
  ADMIN_API_BASE,
  AuthApiError,
  adminHeaders,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type {
  AnalyticsReport,
  AnalyticsScopeFlags,
} from '@/types/adminAnalyticsReports';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string | { message?: string; code?: string };
};

type AnalyticsQueryParams = {
  startDate?: string;
  endDate?: string;
  scope?: Partial<AnalyticsScopeFlags>;
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
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
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

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }
  if (!res.ok) {
    throw new AuthApiError(fallback, 'REQUEST_FAILED');
  }
  return { success: true } as ApiEnvelope<T>;
}

function buildQuery(params: AnalyticsQueryParams) {
  const q = new URLSearchParams();
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  const scope = params.scope;
  if (scope) {
    if (scope.includeDeletedUsers) q.set('includeDeletedUsers', 'true');
    if (scope.includePartners) q.set('includePartners', 'true');
    if (scope.includeBusinesses) q.set('includeBusinesses', 'true');
    if (scope.excludeRefundedOriginals) q.set('excludeRefundedOriginals', 'true');
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getAnalyticsReport(
  params: AnalyticsQueryParams
): Promise<AnalyticsReport> {
  const res = await fetch(`${ADMIN_API_BASE}/reports/analytics${buildQuery(params)}`, {
    method: 'GET',
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const body = await handleAdminResponse<AnalyticsReport>(res, 'Failed to load analytics');
  if (!body.data) {
    throw new AuthApiError('Analytics payload missing', 'REQUEST_FAILED');
  }
  return body.data;
}

export async function syncBuyPowerLedger(params?: {
  start?: string;
  end?: string;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${ADMIN_API_BASE}/reports/analytics/buypower-ledger/sync`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params || {}),
  });
  const body = await handleAdminResponse<Record<string, unknown>>(
    res,
    'Failed to sync BuyPower ledger'
  );
  return body.data || {};
}

export async function downloadAnalyticsExport(
  format: 'pdf' | 'csv',
  params: AnalyticsQueryParams
): Promise<void> {
  const path =
    format === 'pdf'
      ? `/reports/analytics/export.pdf${buildQuery(params)}`
      : `/reports/analytics/export.csv${buildQuery(params)}`;

  const res = await fetch(`${ADMIN_API_BASE}${path}`, {
    method: 'GET',
    headers: adminHeaders(),
    cache: 'no-store',
  });

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }
  if (!res.ok) {
    throw new AuthApiError(`Failed to export ${format.toUpperCase()}`, 'REQUEST_FAILED');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] ||
    `belpower-analytics.${format === 'pdf' ? 'pdf' : 'csv'}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
