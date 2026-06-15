'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminDemoBanner } from '@/components/admin/ui/AdminDemoBanner';
import AdminTopBar from '@/components/admin/layouts/topbar/Topbar';
import { AdminShellProvider } from '@/context/AdminShellContext';
import { formatAdminDocumentTitle } from '@/utils/adminPageTitle';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { redirectToSignIn } from '@/lib/adminAuth';
import { isPublicAdminRoute } from '@/utils/adminPublicRoutes';
import '@/styles/adminShell.css';

type AdminDashboardProps = {
  children: ReactNode;
};

export default function AdminDashboardLayout({ children }: AdminDashboardProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const isPublicRoute = isPublicAdminRoute(pathname);

  useEffect(() => {
    document.title = formatAdminDocumentTitle(pathname);
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      redirectToSignIn(pathname);
      return;
    }

    if (isAuthenticated && pathname === '/command-center/sign-in') {
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get('from') || '/command-center';
      window.location.href = from;
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading command center...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminShellProvider>
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: '4rem' }}>
        <AdminTopBar />
        <div className="admin_shell_row">
          <Sidebar />
          <div className="admin_shell_main focus:outline-none">
            <main className="flex-1 p-4 md:p-6">
              <AdminDemoBanner message="Demo mode is active for team review. All figures and records are sample data and actions do not call the live backend." />
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminShellProvider>
  );
}
