import type {
  AdminBillSchedule,
  AdminScheduleTransaction,
  AdminScheduleUser,
  ScheduleHistoryItem,
  SchedulesListData,
} from '@/types/adminSchedules';

type RawUser = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

type RawTransaction = {
  id?: string;
  reference?: string;
  order_id?: string;
  status?: string;
  amount?: number | string;
};

type RawSchedule = {
  id?: string;
  user_id?: string;
  transaction_id?: string | null;
  schedule_frequency?: string;
  next_purchase?: string;
  next_run_at?: string;
  status?: string;
  amount?: number | string;
  service_type?: string;
  service_provider?: string;
  recipient?: string;
  plan_name?: string | null;
  payment_method?: string;
  pause_reason?: string | null;
  last_error?: string | null;
  retry_count?: number;
  max_retries?: number;
  created_at?: string;
  updated_at?: string;
  user?: RawUser;
  transaction?: RawTransaction;
};

function normalizeUser(raw?: RawUser): AdminScheduleUser | undefined {
  if (!raw?.id) return undefined;
  return {
    id: raw.id,
    email: raw.email ?? '',
    firstName: raw.first_name ?? '',
    lastName: raw.last_name ?? '',
    phone: raw.phone ?? '',
  };
}

function normalizeTransaction(raw?: RawTransaction): AdminScheduleTransaction | undefined {
  if (!raw?.id) return undefined;
  return {
    id: raw.id,
    reference: raw.reference ?? '',
    orderId: raw.order_id ?? '',
    status: raw.status ?? '',
    amount: raw.amount ?? 0,
  };
}

export function normalizeAdminSchedule(raw: RawSchedule): AdminBillSchedule {
  return {
    id: raw.id ?? '',
    userId: raw.user_id ?? '',
    transactionId: raw.transaction_id ?? null,
    scheduleFrequency: raw.schedule_frequency ?? '',
    nextPurchase: raw.next_purchase ?? '',
    nextRunAt: raw.next_run_at ?? '',
    status: (raw.status ?? 'active') as AdminBillSchedule['status'],
    amount: raw.amount ?? 0,
    serviceType: (raw.service_type ?? 'airtime') as AdminBillSchedule['serviceType'],
    serviceProvider: raw.service_provider ?? '',
    recipient: raw.recipient ?? '',
    planName: raw.plan_name ?? null,
    paymentMethod: raw.payment_method ?? 'wallet',
    pauseReason: raw.pause_reason ?? null,
    lastError: raw.last_error ?? null,
    retryCount: raw.retry_count,
    maxRetries: raw.max_retries,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    user: normalizeUser(raw.user),
    transaction: normalizeTransaction(raw.transaction),
  };
}

export function normalizeSchedulesList(data: {
  schedules?: RawSchedule[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
  };
}): SchedulesListData {
  return {
    schedules: (data.schedules ?? []).map(normalizeAdminSchedule),
    pagination: {
      total: data.pagination?.total ?? 0,
      page: data.pagination?.page ?? 1,
      limit: data.pagination?.limit ?? 20,
      totalPages: data.pagination?.total_pages ?? 1,
    },
  };
}

export function normalizeScheduleHistory(
  rows: Array<{
    id?: string;
    reference?: string;
    order_id?: string;
    status?: string;
    amount?: number | string;
    created_at?: string;
    completed_at?: string | null;
    failure_reason?: string | null;
  }>
): ScheduleHistoryItem[] {
  return rows.map((row) => ({
    id: row.id ?? '',
    reference: row.reference ?? '',
    orderId: row.order_id ?? '',
    status: row.status ?? '',
    amount: row.amount ?? 0,
    createdAt: row.created_at ?? '',
    completedAt: row.completed_at ?? null,
    failureReason: row.failure_reason ?? null,
  }));
}
