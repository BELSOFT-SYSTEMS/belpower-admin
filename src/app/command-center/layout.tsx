'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import AdminTopBar from '@/components/admin/layouts/topbar/Topbar';

type AdminDashboardProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminDashboardProps) {
  // const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Verify authentication on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify', {
          credentials: 'include',
        });

        if (!response.ok) {
          // If not authenticated and not on login page, redirect to login
          if (pathname !== '/command-center/sign-in') {
            const from =
              pathname === '/command-center'
                ? ''
                : `?from=${encodeURIComponent(pathname || '/command-center')}`;
            window.location.href = `/command-center/sign-in${from}`;
            return;
          }
        } else {
          // If authenticated and on login page, redirect to dashboard or intended page
          if (pathname === '/command-center/sign-in') {
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from') || '/command-center';
            window.location.href = from;
            return;
          }
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        if (pathname !== '/command-center/sign-in') {
          window.location.href = '/command-center/sign-in';
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [pathname]);

  // Show loading state while verifying auth
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

  // Don't render layout for login page
  if (pathname === '/command-center/sign-in') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopBar />
      <div className="flex h-screen overflow-hidden" style={{ paddingTop: '4rem' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 overflow-auto focus:outline-none">
          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
