'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  // const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();

        if (data.user?.role !== requiredRole) {
          throw new Error('Unauthorized');
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthorized(false);

        // Only redirect if we're not already on the login page
        if (pathname !== '/command-center/sign-in') {
          const from = pathname || '/';
          router.push(`/command-center/sign-in?from=${encodeURIComponent(from)}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [pathname, requiredRole, router]);

  // If we're still loading, show a loading spinner
  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If not authorized and not on login page, we've already handled the redirect in the effect
  if (!isAuthorized && pathname !== '/command-center/sign-in') {
    return null; // Let the redirect happen
  }

  // If we're on the login page and not authorized, show the login page
  if (pathname === '/command-center/sign-in' && !isAuthorized) {
    return <>{children}</>;
  }

  // If we're authorized, show the protected content
  return <>{children}</>;
}
