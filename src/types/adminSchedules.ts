export type AdminScheduleStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AdminScheduleServiceType = 'airtime' | 'data' | 'electricity' | 'cable';

export interface AdminScheduleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AdminScheduleTransaction {
  id: string;
  reference: string;
  orderId: string;
  status: string;
  amount: number | string;
}

export interface AdminBillSchedule {
  id: string;
  userId: string;
  transactionId?: string | null;
  scheduleFrequency: string;
  nextPurchase: string;
  nextRunAt: string;
  status: AdminScheduleStatus;
  amount: number | string;
  serviceType: AdminScheduleServiceType;
  serviceProvider: string;
  recipient: string;
  planName?: string | null;
  paymentMethod: string;
  pauseReason?: string | null;
  lastError?: string | null;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: AdminScheduleUser;
  transaction?: AdminScheduleTransaction;
}

export interface SchedulesListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SchedulesListData {
  schedules: AdminBillSchedule[];
  pagination: SchedulesListPagination;
}

export interface SchedulesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  serviceType?: string;
  userId?: string;
}

export interface ScheduleHistoryItem {
  id: string;
  reference: string;
  orderId: string;
  status: string;
  amount: number | string;
  createdAt: string;
  completedAt?: string | null;
  failureReason?: string | null;
}
