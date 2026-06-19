export type NotificationKind =
  | 'promotional'
  | 'transactional'
  | 'security'
  | 'maintenance'
  | 'payment'
  | 'service_update';

export type NotificationAudience =
  | 'all_users'
  | 'specific_state'
  | 'specific_disco'
  | 'active_users'
  | 'dormant_users'
  | 'single_user';

export type NotificationChannel = 'push' | 'email';

export type NotificationTemplate = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  channel: NotificationChannel;
  email_subject?: string | null;
};

export type SentNotification = {
  id: string;
  template_title: string;
  kind: NotificationKind;
  audience_label: string;
  recipient_count: number;
  sent_at: string;
  sent_by: string;
};

export type NotificationProviderOption = {
  code: string;
  label: string;
  category: 'electricity' | 'airtime' | 'data' | 'cable';
};

export type NotificationStats = {
  scope: 'mine' | 'all';
  can_view_all: boolean;
  sent_today: number;
  last_broadcast_reach: number | null;
  total_sent: number;
};

export type SendNotificationPayload = {
  template_id: string;
  audience: NotificationAudience;
  states?: string[];
  /** @deprecated use providers */
  discos?: string[];
  providers?: string[];
  user_id?: string;
};
