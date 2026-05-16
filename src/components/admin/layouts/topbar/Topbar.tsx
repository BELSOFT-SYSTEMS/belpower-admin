"use client";

// External imports
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import { IoMdNotifications } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";

// Internal imports
import { useAppTranslation } from "@/hooks/useAppTranslation";
import NotificationModal from "@/components/NotificationsModal";
import "@/components/admin/layouts/topbar/topbar.css";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * Interface for notification items
 */
interface Notification {
  id: number;
  title: string;
  message: string;
  type: "Airtime" | "Data" | "Offers" | "Electricity" | "Other" | "Cable";
  read: boolean;
  createdAt: Date;
  details?: string;
}

/**
 * TopBar component - Displays the application's top navigation bar
 * Includes profile dropdown and notifications
 */
export default function AdminTopBar() {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs and hooks
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useAppTranslation();

  /**
   * Handler functions
   */
  const closeModal = () => setIsOpen(false);

  /**
   * Click outside handler for profile dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  /**
   * Notification management
   */
  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem("notifications");
    if (stored) {
      const parsed: Notification[] = JSON.parse(stored).map(
        (n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })
      );
      setNotifications(parsed);
    } else {
      // Initialize with dummy notifications if none exist
      const dummyNotifications: Notification[] = [
        {
          id: 1,
          title: "Airtime Received",
          message: "You have received Airtime!",
          type: "Airtime",
          read: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "New Data Plan",
          message: "New Data Plan Available",
          type: "Data",
          read: false,
          createdAt: new Date(),
        },
        {
          id: 3,
          title: "Electricity Bill",
          message: "Electricity Bill Due Soon",
          type: "Electricity",
          read: false,
          createdAt: new Date(),
        },
        {
          id: 4,
          title: "Special Offer",
          message: "Special Offer Just for You!",
          type: "Offers",
          read: true,
          createdAt: new Date(),
        },
      ];

      localStorage.setItem("notifications", JSON.stringify(dummyNotifications));
      setNotifications(dummyNotifications);
    }
  }, []);

  // Persist notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  // Calculate number of unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="topbar">
      <div className="container">
        {/* Desktop Layout */}
        <div className="desktop_topbar">
          {/* Logo */}
          <div className="topbar_logo">
            <Image
              src={"/belpower_full.png"}
              alt="Logo"
              width={500}
              height={500}
              priority
            />
          </div>

          {/* Right section: Notifications & Profile */}
          <div className="topbar_right">
            {/* Notification Button */}
            <button onClick={() => setIsModalOpen(true)} className="relative">
              <IoMdNotifications size={25} className="notify_icon" />
              {unreadCount > 0 && (
                <>
                  <span className="notification_unread"></span>
                  <span className="notification_read"></span>
                </>
              )}
            </button>

            {/* Profile Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="topbar_profile" title="Open profile menu">
              <Image
                src={"/Profile.png"}
                alt="Profile"
                width={400}
                height={400}
                priority
              />
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mobile_topbar">
          {/* Profile Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="topbar_profile" title="Open profile menu">
            <Image
              src={"/Profile.png"}
              alt="Profile"
              width={400}
              height={400}
              priority
            />
          </button>

          {/* Notification Button */}
          <button onClick={() => setIsModalOpen(true)} className="relative">
            <IoMdNotifications size={30} className="notify_icon" />
            {unreadCount > 0 && (
              <>
                <span className="notification_unread"></span>
                <span className="notification_read"></span>
              </>
            )}
          </button>
        </div>

        {/* Profile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={modalRef}
              className=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="profile_card profile_mobile"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Account Link */}
                <Link
                  href={"/command-center/settings"}
                  onClick={() => setIsOpen(false)}
                >
                  <IoMdSettings />
                  {t('profileDropdown.Settings')}
                </Link>

                {/* Logout Button */}
                <div className="px-4 py-2">
                  <LogoutButton />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Modal */}
        <NotificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notifications={notifications}
          markAsRead={markAsRead}
        />
      </div>
    </div>
  );
}
