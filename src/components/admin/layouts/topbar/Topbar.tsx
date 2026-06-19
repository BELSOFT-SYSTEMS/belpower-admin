"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdNotifications } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { Menu } from "lucide-react";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import NotificationModal from "@/components/NotificationsModal";
import "@/components/admin/layouts/topbar/topbar.css";
import "@/styles/adminShell.css";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminShell } from "@/context/AdminShellContext";
import { canManageMaintenance } from "@/utils/adminSettingsAccess";
import { useAdminInboxNotifications } from "@/hooks/useAdminInboxNotifications";
import { useAdminWebPush } from "@/hooks/useAdminWebPush";
import { InternalTestExclusionToggle } from "@/components/admin/layouts/topbar/InternalTestExclusionToggle";

export default function AdminTopBar() {
  const { displayName, admin, isAuthenticated } = useAdminAuth();
  const { toggleMobileNav } = useAdminShell();
  const showMaintenanceSettings = canManageMaintenance(admin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useAppTranslation();

  const inboxEnabled = isAuthenticated;
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
    isLoading,
    inboxUnavailable,
  } = useAdminInboxNotifications(inboxEnabled);

  useAdminWebPush(inboxEnabled);

  const closeProfileMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeProfileMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      refresh();
    }
  }, [isModalOpen, refresh]);

  const unreadAriaLabel =
    unreadCount === 1
      ? t("notification.unreadCount.singular")
      : t("notification.unreadCount.plural", { count: unreadCount });

  const renderBell = (size: number) => (
    <button
      type="button"
      onClick={() => setIsModalOpen((open) => !open)}
      className="relative"
      aria-label="Notifications"
      aria-expanded={isModalOpen}
      title="Notifications"
    >
      <IoMdNotifications size={size} className="notify_icon" />
      {unreadCount > 0 && (
        <>
          <span className="notification_unread" aria-hidden="true" />
          <span className="notification_read" aria-hidden="true" />
          <span className="sr-only">{unreadAriaLabel}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="topbar">
      <div className="container">
        <div className="desktop_topbar">
          <div className="topbar_logo">
            <img src="/belpower_full.png" alt="Logo" />
          </div>

          <div className="topbar_right">
            <InternalTestExclusionToggle />
            {renderBell(25)}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="topbar_profile"
                aria-label="Open profile menu"
                title="Profile"
              >
                <AdminAvatar size={40} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    ref={modalRef}
                    className="profile_card"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="profile_card_user">
                      <AdminAvatar size={36} />
                      <div>
                        <p className="profile_card_name">{displayName}</p>
                        {admin?.email && (
                          <p className="profile_card_email">{admin.email}</p>
                        )}
                      </div>
                    </div>
                    {showMaintenanceSettings && (
                      <Link
                        href="/command-center/settings"
                        onClick={() => setIsOpen(false)}
                      >
                        <IoMdSettings />
                        {t("profileDropdown.Settings")}
                      </Link>
                    )}
                    <LogoutButton />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mobile_topbar">
          <div className="admin_mobile_topbar_left">
            <button
              type="button"
              className="admin_topbar_menu_btn"
              onClick={toggleMobileNav}
              aria-label="Open navigation menu"
              title="Menu"
            >
              <Menu size={22} aria-hidden />
            </button>
            <img
              src="/belpower_full.png"
              alt="BelPower"
              className="admin_mobile_topbar_logo"
            />
          </div>

          <div className="flex items-center gap-4">
          <InternalTestExclusionToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="topbar_profile"
              aria-label="Open profile menu"
              title="Profile"
            >
              <AdminAvatar size={40} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  ref={modalRef}
                  className="profile_card"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="profile_card_user">
                    <AdminAvatar size={36} />
                    <div>
                      <p className="profile_card_name">{displayName}</p>
                      {admin?.email && (
                        <p className="profile_card_email">{admin.email}</p>
                      )}
                    </div>
                  </div>
                  {showMaintenanceSettings && (
                    <Link
                      href="/command-center/settings"
                      onClick={() => setIsOpen(false)}
                    >
                      <IoMdSettings />
                      {t("profileDropdown.Settings")}
                    </Link>
                  )}
                  <LogoutButton />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {renderBell(30)}
          </div>
        </div>

        <NotificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notifications={notifications}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          isLoading={isLoading}
          inboxUnavailable={inboxUnavailable}
        />
      </div>
    </div>
  );
}
