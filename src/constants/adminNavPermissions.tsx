import type { ReactNode } from 'react';
import {
  FaHome,
  FaUsers,
  FaExchangeAlt,
  FaTachometerAlt,
  FaCog,
  FaWallet,
  FaServer,
  FaUserShield,
  FaBell,
  FaEnvelope,
  FaShieldAlt,
  FaHandshake,
  FaCalendarAlt,
} from 'react-icons/fa';

export type AdminNavItem = {
  name: string;
  href: string;
  icon: ReactNode;
  /** Omit to show for any authenticated admin */
  permission?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    name: 'Home',
    href: '/command-center',
    icon: <FaHome className="w-5 h-5" />,
    permission: 'dashboard.view',
  },
  {
    name: 'Users',
    href: '/command-center/users',
    icon: <FaUsers className="w-5 h-5" />,
    permission: 'users.list',
  },
  {
    name: 'Partners',
    href: '/command-center/partners',
    icon: <FaHandshake className="w-5 h-5" />,
    permission: 'partners.list',
  },
  {
    name: 'Transactions',
    href: '/command-center/transactions',
    icon: <FaExchangeAlt className="w-5 h-5" />,
    permission: 'transactions.list',
  },
  {
    name: 'Schedules',
    href: '/command-center/schedules',
    icon: <FaCalendarAlt className="w-5 h-5" />,
    permission: 'transactions.list',
  },
  {
    name: 'Check Meter',
    href: '/command-center/check-meter',
    icon: <FaTachometerAlt className="w-5 h-5" />,
    permission: 'meters.verify',
  },
  {
    name: 'Wallet',
    href: '/command-center/wallet',
    icon: <FaWallet className="w-5 h-5" />,
    permission: 'transactions.list',
  },
  {
    name: 'Service Availability',
    href: '/command-center/service-availability',
    icon: <FaServer className="w-5 h-5" />,
    permission: 'services.availability',
  },
  {
    name: 'Fraud Events',
    href: '/command-center/security/fraud-events',
    icon: <FaShieldAlt className="w-5 h-5" />,
    permission: 'fraud.view',
  },
  {
    name: 'Admin Management',
    href: '/command-center/admins',
    icon: <FaUserShield className="w-5 h-5" />,
    permission: 'admins.list',
  },
  {
    name: 'Notifications',
    href: '/command-center/notifications',
    icon: <FaBell className="w-5 h-5" />,
    permission: 'notifications.manage',
  },
  {
    name: 'Messages',
    href: '/command-center/messages',
    icon: <FaEnvelope className="w-5 h-5" />,
    permission: 'messages.view',
  },
  {
    name: 'Settings',
    href: '/command-center/settings',
    icon: <FaCog className="w-5 h-5" />,
    permission: 'system.maintenance',
  },
];

export const PUBLIC_ADMIN_PATHS = [
  '/command-center/sign-in',
  '/command-center/setup-account',
  '/command-center/reset-password',
] as const;
