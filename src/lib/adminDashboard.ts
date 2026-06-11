import { ADMIN_API_BASE, adminHeaders, AuthApiError, clearAdminSession, redirectToSignIn } from '@/lib/adminAuth';
import { normalizeDashboardOverview } from '@/lib/normalizeDashboardOverview';
import type {
  DashboardChartPoint,
  DashboardCharts,
  DashboardOverview,
  DashboardOverviewParams,
} from '@/types/adminDashboard';

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

export function buildDashboardOverviewQuery(params: DashboardOverviewParams): URLSearchParams {
  const query = new URLSearchParams({
    months: String(params.months ?? 6),
    recentLimit: String(params.recentLimit ?? 5),
  });

  if (params.userId?.trim()) {
    query.set('userId', params.userId.trim());
  }

  return query;
}

export async function getDashboardOverview(
  params: DashboardOverviewParams = {}
): Promise<DashboardOverview> {
  const query = buildDashboardOverviewQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/dashboard/overview?${query}`, {
      headers: adminHeaders(),
      cache: 'no-store',
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
      getErrorMessage(body, 'You do not have access to this dashboard view'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(getErrorMessage(body, 'Failed to load dashboard'), 'REQUEST_FAILED');
  }

  return normalizeDashboardOverview(body.data);
}

function monthLabel(month: string): string {
  return new Date(`${month}-01`).toLocaleString('en', { month: 'short' });
}

export function mapRevenueChartPoints(
  charts: DashboardCharts | undefined
): DashboardChartPoint[] {
  const showRevenue = charts?.revenueOverview?.visible ?? false;
  if (!showRevenue) return [];

  return (charts?.revenueOverview?.series ?? []).map((point) => ({
    label: monthLabel(point.month),
    period: point.month,
    value: point.amount,
  }));
}

export function mapCountChartPoints(
  series: { month: string; count: number }[] | undefined
): DashboardChartPoint[] {
  return (series ?? []).map((point) => ({
    label: monthLabel(point.month),
    period: point.month,
    value: point.count,
  }));
}

export function showTotalPayments(stats: DashboardOverview['stats'] | undefined): boolean {
  return stats?.totalPayments?.visible ?? false;
}

export function showRevenueChart(charts: DashboardOverview['charts'] | undefined): boolean {
  return charts?.revenueOverview?.visible ?? false;
}
