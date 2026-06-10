import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
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
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </AdminAuthProvider>
  );
}
