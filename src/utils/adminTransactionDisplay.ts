import type { AdminTransaction } from '@/data/adminMockData';

export type ScheduledInfo = {
  frequency: string;
  next_purchase: string;
};

export function formatTxnDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatTxnDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
