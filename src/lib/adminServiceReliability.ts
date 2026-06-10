import {
  ADMIN_API_BASE,
  AuthApiError,
  adminHeaders,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type { ServiceReliabilityData } from '@/types/adminServiceReliability';

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

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProvider(raw: Record<string, unknown>) {
  const discoCode = String(raw.discoCode ?? raw.disco_code ?? '')
    .trim()
    .toUpperCase();
  const vertical = String(raw.vertical ?? '')
    .trim()
    .toUpperCase();
  const successPercentage = toNumber(
    raw.successPercentage ?? raw.success_percentage,
    0
  );
  const pendingPercentage = toNumber(
    raw.pendingPercentage ?? raw.pending_percentage,
    0
  );
  const failurePercentage = toNumber(
    raw.failurePercentage ?? raw.failure_percentage,
    0
  );
  const providerOnline = Boolean(raw.providerOnline ?? raw.provider_online);

  let health = String(raw.health ?? raw.display_health ?? raw.displayHealth ?? '').toLowerCase();
  if (
    health !== 'healthy' &&
    health !== 'watch' &&
    health !== 'degraded' &&
    health !== 'offline'
  ) {
    if (!providerOnline) health = 'offline';
    else if (failurePercentage >= 20 || successPercentage < 80) health = 'degraded';
    else if (failurePercentage >= 5 || successPercentage < 95) health = 'watch';
    else health = 'healthy';
  }

  return {
    vertical,
    verticalLabel: String(raw.verticalLabel ?? raw.vertical_label ?? vertical),
    discoCode,
    displayName: String(raw.displayName ?? raw.display_name ?? discoCode),
    successPercentage,
    pendingPercentage,
    failurePercentage,
    providerOnline,
    health: health as 'healthy' | 'watch' | 'degraded' | 'offline',
  };
}

function normalizeReliabilityData(raw: Record<string, unknown>): ServiceReliabilityData {
  const providersRaw = Array.isArray(raw.providers)
    ? raw.providers
    : Array.isArray(raw)
      ? raw
      : [];

  const providers = providersRaw
    .map((item) => normalizeProvider(item as Record<string, unknown>))
    .filter((provider) => provider.discoCode);

  const summaryRaw = (raw.summary as Record<string, unknown> | undefined) ?? {};
  const summary = {
    healthy: toNumber(summaryRaw.healthy, providers.filter((p) => p.health === 'healthy').length),
    watch: toNumber(summaryRaw.watch, providers.filter((p) => p.health === 'watch').length),
    degraded: toNumber(summaryRaw.degraded, providers.filter((p) => p.health === 'degraded').length),
    offline: toNumber(summaryRaw.offline, providers.filter((p) => p.health === 'offline').length),
    total: toNumber(summaryRaw.total, providers.length),
  };

  return {
    providers,
    summary,
    fetchedAt:
      typeof raw.fetchedAt === 'string'
        ? raw.fetchedAt
        : typeof raw.fetched_at === 'string'
          ? raw.fetched_at
          : new Date().toISOString(),
  };
}

export async function getServiceReliabilityIndex(): Promise<ServiceReliabilityData> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/providers/reliability-index`, {
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
      getErrorMessage(body, 'You do not have permission to view service availability'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(
      getErrorMessage(body, 'Failed to load service availability'),
      'REQUEST_FAILED'
    );
  }

  return normalizeReliabilityData(body.data);
}
