import type { NotificationChannel, NotificationKind } from '@/types/adminNotifications';

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

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push & in-app',
  email: 'Email',
};

export function getNotificationChannelPillClass(channel: NotificationChannel): string {
  return channel === 'email' ? 'pill_notif_email' : 'pill_notif_push';
}
