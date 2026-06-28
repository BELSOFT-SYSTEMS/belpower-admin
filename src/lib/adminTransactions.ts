import {
  ADMIN_API_BASE,
  adminHeaders,
  AuthApiError,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';
import { normalizeAdminTransactionDetail } from '@/lib/normalizeAdminTransactionDetail';
import { normalizeTransactionsList } from '@/lib/normalizeTransactionsList';
import { devLogTransactionDetailResponse } from '@/utils/logTransactionDetailFields';
import type {
  BlockTransactionResult,
  ClearTransactionReviewResult,
  RequeryTransactionResult,
  RefundTransactionResult,
  TransactionDetailData,
  TransactionsListData,
  TransactionsListParams,
  TransactionsListStats,
  TransactionsQuickActions,
  UnblockTransactionResult,
} from '@/types/adminTransactions';

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

export function buildTransactionsListQuery(params: TransactionsListParams): URLSearchParams {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    sort: params.sort ?? 'createdAt:desc',
  });

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.type) {
    query.set('type', params.type);
  }

  if (params.flagged) {
    query.set('flagged', 'true');
  } else if (params.status) {
    query.set('status', params.status);
  }

  if (params.userId?.trim()) {
    query.set('userId', params.userId.trim());
  }

  if (params.partnerId?.trim()) {
    query.set('partnerId', params.partnerId.trim());
  }

  if (params.paymentMethod?.trim()) {
    query.set('paymentMethod', params.paymentMethod.trim());
  }

  if (params.walletActivity) {
    query.set('walletActivity', 'true');
  }

  if (params.includeStats === false) {
    query.set('includeStats', 'false');
  }

  return query;
}

export async function getTransactionsList(
  params: TransactionsListParams
): Promise<TransactionsListData> {
  const query = buildTransactionsListQuery(params);

  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/transactions?${query}`, {
      headers: adminHeaders(),
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
      getErrorMessage(body, 'You do not have access to transactions'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(
      getErrorMessage(body, 'Failed to load transactions'),
      'REQUEST_FAILED'
    );
  }

  return normalizeTransactionsList(body.data);
}

export async function getTransactionDetail(transactionId: string): Promise<TransactionDetailData> {
  let res: Response;
  try {
    res = await fetch(
      `${ADMIN_API_BASE}/transactions/${encodeURIComponent(transactionId)}`,
      { headers: adminHeaders() }
    );
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
      getErrorMessage(body, 'You do not have access to this transaction'),
      'FORBIDDEN'
    );
  }

  if (res.status === 404) {
    throw new AuthApiError(getErrorMessage(body, 'Transaction not found'), 'NOT_FOUND');
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(
      getErrorMessage(body, 'Failed to load transaction'),
      'REQUEST_FAILED'
    );
  }

  const normalized = normalizeAdminTransactionDetail(body.data);
  devLogTransactionDetailResponse(transactionId, body.data, normalized);
  return normalized;
}

export type TransactionsOverviewData = {
  stats: TransactionsListStats;
  quickActions: TransactionsQuickActions;
  generatedAt?: string;
};

export async function getTransactionsOverview(): Promise<TransactionsOverviewData> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}/transactions/overview`, {
      headers: adminHeaders(),
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
      getErrorMessage(body, 'You do not have access to transactions'),
      'FORBIDDEN'
    );
  }

  if (!res.ok || body.success === false || !body.data) {
    throw new AuthApiError(
      getErrorMessage(body, 'Failed to load transaction stats'),
      'REQUEST_FAILED'
    );
  }

  const normalized = normalizeTransactionsList({
    ...body.data,
    transactions: [],
    pagination: { page: 1, limit: 0, total: 0, totalPages: 1 },
  });

  if (!normalized.stats) {
    throw new AuthApiError('Transaction stats unavailable', 'REQUEST_FAILED');
  }

  return {
    stats: normalized.stats,
    quickActions: normalized.quickActions,
    generatedAt: normalized.generatedAt,
  };
}

async function postTransactionAction<T>(
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN_API_BASE}${path}`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = (await res.json()) as ApiEnvelope<T>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (res.status === 403) {
    throw new AuthApiError(
      getErrorMessage(body, 'You do not have permission for this action'),
      'FORBIDDEN'
    );
  }

  if (res.status === 404) {
    throw new AuthApiError(getErrorMessage(body, 'Transaction not found'), 'NOT_FOUND');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, 'Action failed'), 'REQUEST_FAILED');
  }

  return body.data as T;
}

export async function blockTransaction(
  transactionId: string,
  reason?: string
): Promise<BlockTransactionResult> {
  return postTransactionAction<BlockTransactionResult>('/transactions/block', {
    transactionId,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}

export async function unblockTransaction(
  transactionId: string,
  reason?: string
): Promise<UnblockTransactionResult> {
  return postTransactionAction<UnblockTransactionResult>('/transactions/unblock', {
    transactionId,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}

async function postTransactionByIdAction<T>(
  transactionId: string,
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  let res: Response;
  const path = `${ADMIN_API_BASE}/transactions/${encodeURIComponent(transactionId)}/${action}`;

  try {
    res = await fetch(path, {
      method: 'POST',
      headers: adminHeaders(),
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
  } catch {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  }

  const body = (await res.json()) as ApiEnvelope<T>;

  if (res.status === 401) {
    clearAdminSession();
    redirectToSignIn();
    throw new AuthApiError('Session expired', 'UNAUTHORIZED');
  }

  if (res.status === 403) {
    throw new AuthApiError(
      getErrorMessage(body, 'You do not have permission for this action'),
      'FORBIDDEN'
    );
  }

  if (res.status === 404) {
    throw new AuthApiError(getErrorMessage(body, 'Transaction not found'), 'NOT_FOUND');
  }

  if (!res.ok || body.success === false) {
    throw new AuthApiError(getErrorMessage(body, 'Action failed'), 'REQUEST_FAILED');
  }

  return body.data as T;
}

export async function clearTransactionReview(
  transactionId: string
): Promise<ClearTransactionReviewResult> {
  return postTransactionByIdAction<ClearTransactionReviewResult>(
    transactionId,
    'clear-review'
  );
}

export async function requeryTransaction(
  transactionId: string
): Promise<RequeryTransactionResult> {
  return postTransactionByIdAction<RequeryTransactionResult>(transactionId, 'requery');
}

export async function refundTransaction(
  transactionId: string,
  reason?: string
): Promise<RefundTransactionResult> {
  return postTransactionByIdAction<RefundTransactionResult>(transactionId, 'refund', {
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
}
