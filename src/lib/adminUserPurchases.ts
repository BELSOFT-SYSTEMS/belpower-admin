import { ADMIN_API_BASE, adminHeaders, AuthApiError } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: { error_code?: string };
};

export type PurchasePreflight = {
  walletBalance: number;
  userStatus: string;
  displayStatus: string;
  isBlocked: boolean;
  isSuspended: boolean;
  isSuspicious: boolean;
  maintenance: {
    airtime: boolean;
    data: boolean;
    electricity: boolean;
    cable: boolean;
  };
  canPurchase: boolean;
  blockReasons: string[];
  maxSingleTransaction: number;
};

export type AdminPurchaseService = 'airtime' | 'data' | 'electricity' | 'cable';

export type AdminPurchaseResult = {
  transaction_id?: string;
  reference?: string;
  order_id?: string;
  amount?: number;
  status?: string;
  pending?: boolean;
  message?: string;
  electricity?: {
    token?: string | null;
    units?: number | null;
  };
};

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & { data?: T & AdminPurchaseResult };

  if (res.status === 202) {
    const pendingData = (body.data ?? body) as T & AdminPurchaseResult;
    return {
      ...pendingData,
      pending: true,
      status: pendingData.status || 'pending',
      message: body.message || pendingData.message || fallback,
    } as T;
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(
      body.message ?? fallback,
      body.errors?.error_code
    );
  }
  return (body.data ?? body) as T;
}

export async function fetchPurchasePreflight(userId: string): Promise<PurchasePreflight> {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/purchases/preflight`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseResponse<PurchasePreflight>(res, 'Failed to load purchase preflight');
}

export async function purchaseBillForUser(
  userId: string,
  service: AdminPurchaseService,
  payload: Record<string, unknown>
): Promise<AdminPurchaseResult> {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/purchases/${service}`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<AdminPurchaseResult>(res, `${service} purchase failed`);
}
