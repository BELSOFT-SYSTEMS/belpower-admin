import type { AdminScheduleStatus } from '@/types/adminSchedules';

export function formatScheduleStatusLabel(status: AdminScheduleStatus | string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function scheduleStatusClass(status: AdminScheduleStatus | string): string {
  switch (status) {
    case 'active':
      return 'admin_pill admin_pill_success';
    case 'paused':
      return 'admin_pill admin_pill_warning';
    case 'completed':
      return 'admin_pill admin_pill_muted';
    case 'failed':
    case 'cancelled':
      return 'admin_pill admin_pill_danger';
    default:
      return 'admin_pill';
  }
}

export function formatPauseReason(reason?: string | null): string {
  if (!reason) return '—';
  switch (reason) {
    case 'user_paused':
      return 'Paused by user';
    case 'admin_paused':
      return 'Paused by admin';
    case 'provider_down':
      return 'Provider unavailable';
    case 'wallet_exhausted':
      return 'Insufficient wallet balance';
    default:
      return reason.replace(/_/g, ' ');
  }
}

export function formatServiceTypeLabel(serviceType: string): string {
  switch (serviceType) {
    case 'airtime':
      return 'Airtime';
    case 'data':
      return 'Data';
    case 'electricity':
      return 'Electricity';
    case 'cable':
      return 'Cable TV';
    default:
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
  }
}
