import {
  ADMIN_API_BASE,
  AuthApiError,
  adminHeaders,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import type {
  MaintenancePatch,
  MaintenanceState,
  MaintenanceToggleKey,
} from '@/types/adminMaintenance';

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

function normalizeMaintenanceState(raw: Record<string, unknown> | undefined): MaintenanceState {
  const services = (raw?.services as Record<string, unknown> | undefined) ?? {};

  return {
    userLogin: Boolean(raw?.userLogin),
    userPurchase: Boolean(raw?.userPurchase),
    walletFunding: Boolean(raw?.walletFunding),
    paystackDva: Boolean(raw?.paystackDva),
    buyPowerDva: Boolean(raw?.buyPowerDva),
    services: {
      airtime: Boolean(services.airtime),
      data: Boolean(services.data),
      electricity: Boolean(services.electricity),
      cable: Boolean(services.cable),
    },
  };
}

export function maintenanceStateToFlags(state: MaintenanceState): Record<MaintenanceToggleKey, boolean> {
  return {
    stop_login: state.userLogin,
    stop_all_purchases: state.userPurchase,
    stop_wallet_funding: state.walletFunding,
    stop_paystack_dva: state.paystackDva,
    stop_buypower_dva: state.buyPowerDva,
    stop_airtime: state.services.airtime,
    stop_data: state.services.data,
    stop_electricity: state.services.electricity,
    stop_cable: state.services.cable,
  };
}

export function buildMaintenancePatch(
  key: MaintenanceToggleKey,
  enabled: boolean
): MaintenancePatch {
  switch (key) {
    case 'stop_login':
      return { userLogin: enabled };
    case 'stop_all_purchases':
      return { userPurchase: enabled };
    case 'stop_wallet_funding':
      return { walletFunding: enabled };
    case 'stop_paystack_dva':
      return { paystackDva: enabled };
    case 'stop_buypower_dva':
      return { buyPowerDva: enabled };
    case 'stop_airtime':
      return { services: { airtime: enabled } };
    case 'stop_data':
      return { services: { data: enabled } };
    case 'stop_electricity':
      return { services: { electricity: enabled } };
    case 'stop_cable':
      return { services: { cable: enabled } };
    default:
      return {};
  }
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const res = await fetch(`${ADMIN_API_BASE}/system/maintenance`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });

  const body = await handleAdminResponse<{ maintenance?: Record<string, unknown> }>(
    res,
    'Failed to load maintenance settings'
  );

  return normalizeMaintenanceState(body.data?.maintenance);
}

export async function patchMaintenanceState(
  patch: MaintenancePatch
): Promise<MaintenanceState> {
  const res = await fetch(`${ADMIN_API_BASE}/system/maintenance`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });

  const body = await handleAdminResponse<{ state?: Record<string, unknown> }>(
    res,
    'Failed to update maintenance settings'
  );

  return normalizeMaintenanceState(body.data?.state);
}
