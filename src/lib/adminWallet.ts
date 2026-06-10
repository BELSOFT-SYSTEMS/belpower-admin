import {
  ADMIN_API_BASE,
  AuthApiError,
  adminHeaders,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type { WalletOverviewStats } from '@/types/adminWallet';

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

function normalizeWalletOverviewStats(raw: Record<string, unknown> | undefined): WalletOverviewStats {
  const total = (raw?.totalUserBalance as Record<string, unknown> | undefined) ?? {};
  const buyPower = (raw?.buyPowerBalance as Record<string, unknown> | undefined) ?? {};
  const funding = (raw?.fundingCount as Record<string, unknown> | undefined) ?? {};
  const debit = (raw?.debitCount as Record<string, unknown> | undefined) ?? {};
  const flagged = (raw?.flaggedCount as Record<string, unknown> | undefined) ?? {};

  return {
    totalUserBalance: {
      amount: total.amount == null ? null : Number(total.amount),
      currency: 'NGN',
      canView: Boolean(total.canView),
    },
    buyPowerBalance: {
      amount: buyPower.amount == null ? null : Number(buyPower.amount),
      currency: 'NGN',
      canView: Boolean(buyPower.canView),
      lastUpdated:
        typeof buyPower.lastUpdated === 'string'
          ? buyPower.lastUpdated
          : typeof buyPower.last_updated === 'string'
            ? buyPower.last_updated
            : null,
    },
    fundingCount: { count: Number(funding.count ?? 0) },
    debitCount: { count: Number(debit.count ?? 0) },
    flaggedCount: { count: Number(flagged.count ?? 0) },
  };
}

export async function getWalletOverview(): Promise<WalletOverviewStats> {
  const res = await fetch(`${ADMIN_API_BASE}/wallet/overview`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });

  const body = await handleAdminResponse<{ stats?: Record<string, unknown> }>(
    res,
    'Failed to load wallet overview'
  );

  return normalizeWalletOverviewStats(body.data?.stats);
}
