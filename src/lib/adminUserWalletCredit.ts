import { ADMIN_API_BASE, adminHeaders, AuthApiError } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: { error_code?: string };
};

export type WalletCreditPreflight = {
  walletBalance: number;
  userStatus: string;
  canCredit: boolean;
  blockReasons: string[];
  maxWalletBalance: number | null;
  maxCreditAllowed: number | null;
  isInternalTestAccount?: boolean;
};

export type ManualWalletCreditPayload = {
  amount: number;
  bankReference: string;
  bankReceivedAt?: string;
  adminNote: string;
  notifyUser?: boolean;
};

export type ManualWalletCreditResult = {
  transactionId: string;
  reference: string;
  amount: number;
  walletBalance: number;
  previousBalance: number;
};

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new AuthApiError(
      body.message ?? fallback,
      body.errors?.error_code
    );
  }
  return (body.data ?? body) as T;
}

export async function fetchWalletCreditPreflight(
  userId: string
): Promise<WalletCreditPreflight> {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/wallet/credit/preflight`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseResponse<WalletCreditPreflight>(res, 'Failed to load wallet credit preflight');
}

export async function creditUserWalletManual(
  userId: string,
  payload: ManualWalletCreditPayload
): Promise<ManualWalletCreditResult> {
  const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/wallet/credit`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ManualWalletCreditResult>(res, 'Wallet credit failed');
}
