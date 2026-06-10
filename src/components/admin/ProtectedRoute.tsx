'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { redirectToSignIn } from '@/lib/adminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      redirectToSignIn(pathname);
      return;
    }

    setReady(true);
  }, [isAuthenticated, isLoading, pathname]);

  if (isLoading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
