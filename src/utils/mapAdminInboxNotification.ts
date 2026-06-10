import type { AdminInboxNotification } from '@/types/adminInboxNotifications';
import type { Notification } from '@/components/NotificationsModal';

function mapDisplayType(
  type: string
): Notification['type'] {
  switch (type) {
    case 'offers':
    case 'promotional':
      return 'Offers';
    case 'service':
    case 'transaction_success':
    case 'transaction_pending':
    case 'transaction_failed':
      return 'Electricity';
    case 'admin':
    case 'system':
    case 'system_maintenance':
    case 'support':
    default:
      return 'Other';
  }
}

export function mapAdminInboxToModalNotification(
  item: AdminInboxNotification
): Notification {
  return {
    id: item.id,
    uuid: item.id,
    title: item.title,
    message: item.message,
    type: mapDisplayType(item.type),
    read: item.is_read,
    createdAt: new Date(item.created_at),
    details: item.action_url ?? undefined,
  };
}

export function mapAdminActionUrl(actionUrl?: string | null): string | null {
  if (!actionUrl) return null;
  if (actionUrl.startsWith('/admin/')) {
    return actionUrl.replace('/admin/', '/command-center/');
  }
  if (actionUrl.startsWith('/service-availability')) {
    return `/command-center${actionUrl}`;
  }
  return actionUrl;
}
