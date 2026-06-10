/**
 * NotificationsModal — belpower-staging design:
 * full-screen backdrop + top-right panel slide-in (Framer Motion).
 */

'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { BsBellFill, BsCheckAll, BsExclamationTriangle } from 'react-icons/bs';
import { Loader2 } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { TranslationErrorBoundary } from './TranslationErrorBoundary';
import '@/styles/notificationsModal.css';

export interface Notification {
  id: string | number;
  uuid?: string;
  title?: string;
  message: string;
  type: 'Airtime' | 'Data' | 'Offers' | 'Electricity' | 'Other' | 'Cable';
  read: boolean;
  createdAt: Date;
  details?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  markAsRead: (id: string | number) => void;
  markAllAsRead?: () => void;
  isLoading?: boolean;
  inboxUnavailable?: boolean;
}

const NotificationsModalContent = ({
  isOpen,
  onClose,
  notifications = [],
  markAsRead,
  markAllAsRead,
  isLoading = false,
  inboxUnavailable = false,
}: NotificationsModalProps) => {
  const { t } = useAppTranslation();
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread' | 'offers'>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'all') return true;
      if (filter === 'read') return n.read;
      if (filter === 'unread') return !n.read;
      if (filter === 'offers') return n.type === 'Offers';
      return true;
    });
  }, [notifications, filter]);

  const handleNotificationClick = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();

    const key = String(id);
    const notification = notifications.find((n) => String(n.id) === key);
    if (!notification) return;

    if (!notification.read) {
      markAsRead(id);
    }

    setSelectedNotification((prev) => (prev === key ? null : key));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 10) return t('notification.timeAgo.justNow');
    if (seconds < 60) return t('notification.timeAgo.secondsAgo', { count: seconds });

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return minutes === 1
        ? t('notification.timeAgo.minuteAgo')
        : t('notification.timeAgo.minutesAgo', { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours === 1
        ? t('notification.timeAgo.hourAgo')
        : t('notification.timeAgo.hoursAgo', { count: hours });
    }

    const days = Math.floor(hours / 24);
    return days === 1
      ? t('notification.timeAgo.dayAgo')
      : t('notification.timeAgo.daysAgo', { count: days });
  };

  const handleMarkAllAsRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else {
      notifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-black/30"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <div className="flex min-h-screen items-start justify-end p-4 pt-20 text-center pointer-events-none">
            <motion.div
              className="pointer-events-auto relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifications-modal-title"
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="sticky top-0 z-10 shrink-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3
                    id="notifications-modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {t('notification.title')}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    aria-label={t('common.close')}
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex space-x-1 rounded-lg bg-gray-100 p-1">
                  {(['all', 'unread', 'read', 'offers'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                        filter === tab
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t(`notification.${tab}`)}
                    </button>
                  ))}
                </div>
              </div>

              {inboxUnavailable && (
                <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
                  <BsExclamationTriangle className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    Could not reach the admin inbox endpoint (
                    <code className="text-[0.7rem]">GET /notifications/inbox</code>
                    ). Check that the API is deployed and your admin account is linked to a
                    BelPower user for push/in-app alerts.
                  </span>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">{t('common.loading')}</p>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => (
                      <li
                        key={notification.uuid ?? String(notification.id)}
                        className={`px-6 py-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div
                          className="flex items-start justify-between w-full cursor-pointer"
                          onClick={(e) => handleNotificationClick(notification.id, e)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="mt-1">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  notification.read ? 'bg-gray-300' : 'bg-primary'
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 text-left">
                                {notification.title ?? notification.message}
                              </p>
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <span>{formatTimeAgo(notification.createdAt)}</span>
                                <span className="mx-1">•</span>
                                <span className="capitalize">
                                  {notification.type.toLowerCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!notification.read && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 ml-2 mt-1.5 shrink-0" />
                          )}
                        </div>

                        {selectedNotification === String(notification.id) && (
                          <div className="mt-2 pl-5 pr-2">
                            <div className="text-sm text-gray-600 bg-linear-to-r from-gray-50 to-blue-50 border border-gray-200 p-4 rounded-lg whitespace-pre-wrap wrap-break-words text-left shadow-sm">
                              <div className="font-medium text-gray-700 mb-2 text-xs uppercase tracking-wide">
                                Message
                              </div>
                              {notification.message}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <BsBellFill className="mx-auto mb-3 text-gray-200" size={32} />
                    <p className="text-gray-500 text-sm">{t('notification.noNotifications')}</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="sticky bottom-0 shrink-0 bg-white border-t border-gray-100 px-6 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    className="flex items-center text-sm font-medium text-primary hover:text-primary-dark disabled:opacity-50"
                    disabled={!notifications.some((n) => !n.read)}
                  >
                    <BsCheckAll className="mr-1.5 h-4 w-4" />
                    {t('notification.markAllAsRead')}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function NotificationsModal(props: NotificationsModalProps) {
  return (
    <TranslationErrorBoundary
      fallback={
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;re having trouble loading notifications. Please try again later.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={props.onClose}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }
    >
      <NotificationsModalContent {...props} />
    </TranslationErrorBoundary>
  );
}
