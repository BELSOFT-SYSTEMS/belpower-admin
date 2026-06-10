export type AdminInboxNotificationType =
  | 'admin'
  | 'system'
  | 'system_maintenance'
  | 'support'
  | 'service'
  | string;

export type AdminInboxNotification = {
  id: string;
  title: string;
  message: string;
  type: AdminInboxNotificationType;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  read_at?: string | null;
};

export type AdminInboxData = {
  notifications: AdminInboxNotification[];
  unread_count: number;
  linked_user: boolean;
  pagination: {
    total: number;
    page: number;
    total_pages: number;
    limit: number;
  };
};

export type AdminPushConfig = {
  vapidPublicKey: string | null;
  webPushEnabled: boolean;
};
