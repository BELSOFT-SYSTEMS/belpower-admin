'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAdminInbox,
  markAdminInboxNotificationRead,
  markAllAdminInboxNotificationsRead,
} from '@/lib/adminInboxNotifications';
import {
  mapAdminInboxToModalNotification,
  mapAdminActionUrl,
} from '@/utils/mapAdminInboxNotification';
import type { Notification } from '@/components/NotificationsModal';

const POLL_MS = 60_000;

export function useAdminInboxNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [linkedUser, setLinkedUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [inboxUnavailable, setInboxUnavailable] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);

    try {
      const { data, apiAvailable } = await getAdminInbox({ page: 1, limit: 50 });
      if (!mountedRef.current) return;

      setInboxUnavailable(!apiAvailable);
      setLinkedUser(data.linked_user);
      setUnreadCount(data.unread_count);
      setNotifications(data.notifications.map(mapAdminInboxToModalNotification));
    } catch {
      if (!mountedRef.current) return;
      setInboxUnavailable(true);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, POLL_MS);

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, refresh]);

  const markAsRead = useCallback(
    async (id: Notification['id']) => {
      const key = String(id);
      setNotifications((prev) =>
        prev.map((item) =>
          String(item.id) === key ? { ...item, read: true } : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await markAdminInboxNotificationRead(key);
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      await markAllAdminInboxNotificationsRead();
    } catch {
      await refresh();
    }
  }, [refresh]);

  const openNotification = useCallback((notification: Notification) => {
    const target = mapAdminActionUrl(notification.details);
    if (target && typeof window !== 'undefined') {
      window.location.href = target;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    linkedUser,
    isLoading,
    inboxUnavailable,
    refresh,
    markAsRead,
    markAllAsRead,
    openNotification,
  };
}
