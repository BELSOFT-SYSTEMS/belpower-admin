import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { AdminDemoProvider } from '@/context/AdminDemoContext';
import { AdminAnalyticsProvider } from '@/context/AdminAnalyticsContext';
import AdminDashboardLayout from './AdminDashboardLayout';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · BelPower Command Center',
  },
  description:
    'BelPower Command Center — manage users, transactions, wallet activity, notifications, and platform operations.',
};

export default function CommandCenterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthProvider>
      <AdminDemoProvider>
        <AdminAnalyticsProvider>
          <AdminDashboardLayout>{children}</AdminDashboardLayout>
        </AdminAnalyticsProvider>
      </AdminDemoProvider>
    </AdminAuthProvider>
  );
}
