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

export type NotificationTemplate = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
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

export type SendNotificationPayload = {
  template_id: string;
  audience: NotificationAudience;
  states?: string[];
  discos?: string[];
  user_id?: string;
};
