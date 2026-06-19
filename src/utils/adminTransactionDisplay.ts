import { formatInTimeZone } from 'date-fns-tz';
import type { AdminTransaction } from '@/data/adminMockData';
import type { TransactionReviewStatus } from '@/types/adminTransactions';
import { ADMIN_DISPLAY_TIMEZONE, parseApiDate } from '@/utils/parseApiDate';

export type ScheduledInfo = {
  frequency: string;
  next_purchase: string;
};

function formatTxnAbsolute(iso: string, withYear: boolean): string {
  const date = parseApiDate(iso);
  if (!date) return '—';

  return formatInTimeZone(
    date,
    ADMIN_DISPLAY_TIMEZONE,
    withYear ? 'MMM d, yyyy, h:mm aa' : 'MMM d, h:mm aa'
  );
}

export function formatTxnDateTime(iso: string) {
  return formatTxnAbsolute(iso, true);
}

export function formatTxnDateShort(iso: string) {
  return formatTxnAbsolute(iso, false);
}

export function formatScheduledFrequency(frequency: string) {
  const labels: Record<string, string> = {
    once: 'Once',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
  };
  return labels[frequency.toLowerCase()] ?? frequency;
}

export function isScheduledTransaction(tx: AdminTransaction) {
  return Boolean(tx.is_scheduled);
}

export function getTransactionStatusLabel(tx: AdminTransaction) {
  if (isScheduledTransaction(tx)) return 'Scheduled';
  return tx.status;
}

export function getTransactionStatusPillClass(tx: AdminTransaction) {
  if (isScheduledTransaction(tx)) return 'pill_scheduled';
  if (tx.status === 'completed') return 'pill_success';
  if (tx.status === 'pending') return 'pill_pending';
  if (tx.status === 'failed') return 'pill_failed';
  return 'pill_pending';
}

export function getTransactionListDate(tx: AdminTransaction) {
  if (isScheduledTransaction(tx) && tx.scheduled_info?.next_purchase) {
    return `Next · ${formatTxnDateShort(tx.scheduled_info.next_purchase)}`;
  }
  return formatTxnDateShort(tx.created_at);
}

const REVIEW_STATUS_LABELS: Record<TransactionReviewStatus, string> = {
  cleared: 'Cleared',
  under_review: 'Under review',
  escalated: 'Escalated',
  pending: 'Pending review',
  blocked: 'Blocked',
};

export function getTransactionReviewStatusLabel(status: TransactionReviewStatus) {
  return REVIEW_STATUS_LABELS[status] ?? status;
}

export function matchesTransactionStatusFilter(
  tx: AdminTransaction,
  statusFilter: string,
  filterAll: string
) {
  if (statusFilter === filterAll) return true;
  if (statusFilter === 'scheduled') return isScheduledTransaction(tx);
  if (statusFilter === 'flagged') return Boolean(tx.suspicious);
  return tx.status === statusFilter;
}
