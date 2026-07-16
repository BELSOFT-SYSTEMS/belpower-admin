import { ADMIN_API_BASE, adminHeaders, AuthApiError } from '@/lib/adminAuth';
import { pickApiTimestampString } from '@/utils/pickApiField';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: { error_code?: string };
};

export type PartnerWalletCreditPreflight = {
  walletBalance: number;
  utilityBalance?: number;
  bettingBalance?: number;
  partnerStatus: string;
  canCredit: boolean;
  blockReasons: string[];
};

export type ManualPartnerWalletCreditPayload = {
  amount: number;
  bankReference: string;
  bankReceivedAt?: string;
  adminNote: string;
  notifyPartner?: boolean;
  walletType?: 'utility' | 'betting';
};

export type ManualPartnerWalletCreditResult = {
  transactionId: string;
  reference: string;
  amount: number;
  walletBalance: number;
  previousBalance: number;
  walletType?: string;
};

export type PartnerDepositRequestAdminItem = {
  id: string;
  partnerId: string;
  partner: {
    id: string;
    businessName: string;
    agentFullName: string;
    email: string;
    status: string;
  } | null;
  amount: number;
  walletType?: 'utility' | 'betting' | string;
  walletLabel?: string;
  expectedWalletCredit?: number;
  platformDepositFee?: number;
  feeWaived?: boolean;
  bankReference: string | null;
  proofOfPayment?: {
    assetId: string | null;
    imageUrl: string;
    mimeType: string | null;
    fileSize: number | null;
    originalName: string | null;
  } | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new AuthApiError(body.message ?? fallback, body.errors?.error_code);
  }
  return (body.data ?? body) as T;
}

export async function fetchPartnerWalletCreditPreflight(
  partnerId: string
): Promise<PartnerWalletCreditPreflight> {
  const res = await fetch(`${ADMIN_API_BASE}/partners/${partnerId}/wallet/credit/preflight`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseResponse<PartnerWalletCreditPreflight>(res, 'Failed to load partner wallet credit preflight');
}

export async function creditPartnerWalletManual(
  partnerId: string,
  payload: ManualPartnerWalletCreditPayload
): Promise<ManualPartnerWalletCreditResult> {
  const res = await fetch(`${ADMIN_API_BASE}/partners/${partnerId}/wallet/credit`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ManualPartnerWalletCreditResult>(res, 'Partner wallet credit failed');
}

export async function fetchPartnerDepositRequests(status = 'pending'): Promise<{
  items: PartnerDepositRequestAdminItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const res = await fetch(`${ADMIN_API_BASE}/partner-deposits/deposits?status=${status}`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  const data = await parseResponse<{
    items: Array<PartnerDepositRequestAdminItem & { created_at?: string; updated_at?: string }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(res, 'Failed to load partner deposit requests');

  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      createdAt: pickApiTimestampString(item, 'created') ?? '',
      updatedAt: pickApiTimestampString(item, 'updated') ?? '',
    })),
  };
}

export async function approvePartnerDepositRequest(
  depositRequestId: string,
  payload: { bankReference?: string; adminNote?: string; notifyPartner?: boolean }
): Promise<ManualPartnerWalletCreditResult & { depositRequestId: string }> {
  const res = await fetch(`${ADMIN_API_BASE}/partner-deposits/deposits/${depositRequestId}/approve`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res, 'Failed to approve partner deposit');
}

export async function rejectPartnerDepositRequest(
  depositRequestId: string,
  payload: { reason?: string }
): Promise<{ depositRequestId: string; status: string }> {
  const res = await fetch(`${ADMIN_API_BASE}/partner-deposits/deposits/${depositRequestId}/reject`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res, 'Failed to reject partner deposit');
}

export async function fetchPartnerDepositProof(depositRequestId: string): Promise<{
  depositRequestId: string;
  proofOfPayment: {
    assetId: string | null;
    imageUrl: string;
    mimeType: string | null;
    fileSize: number | null;
    originalName: string | null;
  };
}> {
  const res = await fetch(`${ADMIN_API_BASE}/partner-deposits/deposits/${depositRequestId}/proof`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseResponse(res, 'Failed to load deposit proof');
}
