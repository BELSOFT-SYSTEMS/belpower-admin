/**
 * NotificationsModal Component
 *
 * A modal component that displays user notifications with filtering capabilities.
 * Features include:
 * - Animated transitions using Framer Motion
 * - Notification filtering (All, Read, Unread, Offers)
 * - Internationalization support
 * - Read status tracking
 * - Time-ago formatting with translations
 * - Responsive design
 *
 * @example
 * <NotificationsModal
 *   isOpen={isModalOpen}
 *   onClose={() => setModalOpen(false)}
 *   notifications={userNotifications}
 *   markAsRead={(id) => markNotificationAsRead(id)}
 */

'use client';

import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { BsBellFill, BsCheckAll, BsExclamationTriangle } from 'react-icons/bs';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { TranslationErrorBoundary } from './TranslationErrorBoundary';
import '@/styles/notificationsModal.css';

/** Interface defining the structure of a notification */
interface Notification {
  /** Unique identifier for the notification */
  id: number;
  /** Title of the notification */
  title: string;
  /** Content of the notification */
  message: string;
  /** Category of the notification */
  type: 'Airtime' | 'Data' | 'Offers' | 'Electricity' | 'Other' | 'Cable';
  /** Whether the notification has been read */
  read: boolean;
  /** Timestamp when the notification was created */
  createdAt: Date;
  /** Optional: Additional details to show when expanded */
  details?: string;
}

/** Props for the NotificationsModal component */
interface NotificationsModalProps {
  /** Controls the visibility of the modal */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Array of notifications to display */
  notifications: Notification[];
  /** Callback function to mark a notification as read */
  markAsRead: (id: number) => void;
  /** Optional: Callback to clear all notifications */
  clearAll?: () => void;
  /** Optional: Callback to mark all notifications as read */
  markAllAsRead?: () => void;
}

/**
 * A modal component that displays and manages user notifications.
 * Provides filtering options and animated transitions.
 */
// Inner component that contains the actual modal implementation
const NotificationsModalContent = ({
  isOpen,
  onClose,
  notifications = [],
  markAsRead,
  // clearAll,
  markAllAsRead,
}: NotificationsModalProps) => {
  const { t, error } = useAppTranslation();
  // Debug: Log notifications when they change
  useEffect(() => {
    console.log('Notifications in modal:', JSON.stringify(notifications, null, 2));
  }, [notifications]);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread' | 'offers'>('all');

  // Filter notifications based on the selected filter
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'read') return n.read;
    if (filter === 'unread') return !n.read;
    if (filter === 'offers') return n.type === 'Offers';
    return true;
  });

  // Handle notification click - mark as read and toggle details
  const handleNotificationClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Notification clicked:', id);

    // Find the clicked notification
    const notification = notifications.find((n) => n.id === id);
    console.log('Notification details:', notification);

    if (!notification) return;

    // Only mark as read if it's not already read
    if (notification.read === false) {
      markAsRead(id);
    }

    // Toggle the selected notification
    setSelectedNotification((prev) => {
      const newState = prev === id ? null : id;
      console.log('Selected notification state:', newState);
      console.log(
        'Selected notification details:',
        notifications.find((n) => n.id === id)?.details
      );
      return newState;
    });
  };

  // Format time ago with i18n support
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

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else {
      notifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id));
    }
  };

  // Handle clear all
  // const handleClearAll = () => {
  //   if (clearAll) {
  //     clearAll();
  //   }
  //   setSelectedNotification(null);
  // };

  if (!isOpen) return null;

  // If there's an error loading translations, show a fallback UI
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="rounded-lg bg-red-50 p-6 shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <BsExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading notifications</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>We&apos;re having trouble loading your notifications. Please try again later.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-end p-4 pt-20 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
          style={{
            opacity: 1,
            transition: 'opacity 200ms ease-in-out',
          }}
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: 'translateX(0)',
            transition: 'transform 300ms ease-out, opacity 300ms ease-out',
            opacity: 1,
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('notification.title')}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label={t('common.close')}
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="mt-3 flex space-x-1 rounded-lg bg-gray-100 p-1">
              {(['all', 'unread', 'read', 'offers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                    filter === tab
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(`notification.${tab}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <li
                    key={notification.id}
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
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              notification.read ? 'bg-gray-300' : 'bg-primary'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 text-left">
                            {notification.title}
                          </p>

                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            <span className="mx-1">•</span>
                            <span className="capitalize">{notification.type.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 ml-2 mt-1.5 flex-shrink-0" />
                      )}
                    </div>

                    {selectedNotification === notification.id && (
                      <div className="mt-2 pl-5 pr-2">
                        <div className="text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 p-4 rounded-lg whitespace-pre-wrap break-words text-left shadow-sm">
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

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3">
              <div className="flex justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllAsRead();
                  }}
                  className="flex items-center text-sm font-medium text-black hover:text-gray-700 disabled:opacity-50"
                  disabled={!notifications.some((n) => !n.read)}
                >
                  <BsCheckAll className="mr-1.5 h-4 w-4" />
                  {t('notification.markAllAsRead')}
                </button>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  disabled={notifications.length === 0}
                >
                  {t('notification.clearAll')}
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the wrapped component with error boundary
export default function NotificationsModal(props: NotificationsModalProps) {
  return (
    <TranslationErrorBoundary
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;re having trouble loading notifications. Please try again later.
            </p>
            <div className="mt-4">
              <button
                onClick={props.onClose}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
