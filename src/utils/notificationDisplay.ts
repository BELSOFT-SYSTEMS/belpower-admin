import type { NotificationKind } from '@/types/adminNotifications';

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  promotional: 'Promotional',
  transactional: 'Transactional',
  security: 'Security',
  maintenance: 'Maintenance',
  payment: 'Payment',
  service_update: 'Service update',
};

export function getNotificationKindPillClass(kind: NotificationKind): string {
  return `pill_notif_${kind}`;
}
